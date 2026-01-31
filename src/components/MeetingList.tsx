import React, { useEffect, useState } from 'react';
import { meetingService } from '../services/meetingService';
import type { Meeting } from '../types/meeting';
import { MeetingCard } from './MeetingCard';

export const MeetingList: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        setLoading(true);
        try {
            const allMeetings = await meetingService.getMeetings();
            const now = new Date();

            const currentUrl = window.location.href;

            // STRICTER REGEX: Only match actual meeting rooms, not landing pages or setup screens
            // Google Meet: meet.google.com/abc-defg-hij (must have path)
            // Zoom: zoom.us/j/123456 or zoom.us/my/name (must have /j/ or /my/)
            // Teams: teams.microsoft.com/l/meetup-join/... (must have /l/meetup-join)
            const isGoogleMeet = /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(currentUrl);
            const isZoom = /zoom\.us\/(j|my)\//.test(currentUrl);
            const isTeams = /teams\.microsoft\.com\/l\/meetup-join\//.test(currentUrl);

            const isMeetingUrl = isGoogleMeet || isZoom || isTeams;

            // 1. Filter: Show only future or ongoing meetings (end time not passed)
            // This ensures only upcoming and current meetings are displayed
            let relevantMeetings = allMeetings.filter(m => {
                const endTime = new Date(m.end_time);
                const hasNotEnded = endTime > now; // End time hasn't passed yet

                return hasNotEnded;
            });

            // 2. Ad-Hoc Detection
            if (isMeetingUrl) {
                // Check duplicates against ALL meetings (history included), not just displayed ones.
                // This prevents creating a new record if the meeting exists in history (expired).
                const existsInHistory = allMeetings.some(m => m.meeting_url && currentUrl.includes(m.meeting_url));

                // Session Deduplication:
                // Prevent creating multiple records if the component re-mounts or re-renders rapidly (e.g. extension reload, strict mode)
                // We use sessionStorage to track identifying parts of the URL (meeting ID) that we have already processed.

                // Extract unique meeting ID from URL for stable caching
                // Meet: abc-defg-hij, Zoom: /j/123456, Teams: /l/meetup-join/...
                let meetingIdHash = currentUrl;
                const meetMatch = currentUrl.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/);
                if (meetMatch) meetingIdHash = meetMatch[1];

                const hasProcessed = sessionStorage.getItem(`mia_adhoc_${meetingIdHash}`);

                if (!existsInHistory && !hasProcessed) {
                    // Mark as processed immediately to block race conditions
                    sessionStorage.setItem(`mia_adhoc_${meetingIdHash}`, 'true');

                    // Create Optimistic Ad-Hoc Meeting
                    // (Fixes 'Invalid Date' by ensuring we have valid objects immediately)
                    const adHocStart = new Date();
                    const adHocEnd = new Date(adHocStart.getTime() + 60 * 60 * 1000); // Default +1 hour
                    const pageTitle = document.title.replace('Mia - ', '') || 'Ad-Hoc Meeting';

                    const optimisticMeeting: Meeting = {
                        id: `adhoc-${Date.now()}`,
                        title: pageTitle,
                        start_time: adHocStart.toISOString(),
                        end_time: adHocEnd.toISOString(),
                        meeting_url: currentUrl,
                        location: 'Ad-Hoc',
                        description: 'Detected on page',
                        _status: 'saving'
                    };

                    // Show immediately
                    relevantMeetings = [optimisticMeeting, ...relevantMeetings];
                    // We need to update state immediately to show "Saving..."
                    setMeetings(relevantMeetings);

                    // Save to Backend
                    meetingService.createAdHocMeeting(currentUrl, pageTitle)
                        .then((savedMeeting) => {
                            // On success, replace the optimistic one with the real one (or just update status)
                            setMeetings(prev => prev.map(m =>
                                m.id === optimisticMeeting.id ? {
                                    ...savedMeeting,
                                    // Fallback to optimistic data if backend is incomplete
                                    start_time: savedMeeting.start_time || optimisticMeeting.start_time,
                                    end_time: savedMeeting.end_time || optimisticMeeting.end_time,
                                    meeting_url: savedMeeting.meeting_url || optimisticMeeting.meeting_url,
                                    _status: 'saved'
                                } : m
                            ));
                        })
                        .catch(err => {
                            console.error('Failed to persist ad-hoc meeting', err);
                            // On fail, update status to failed
                            setMeetings(prev => prev.map(m =>
                                m.id === optimisticMeeting.id ? { ...m, _status: 'failed' } : m
                            ));
                        });

                    // Return here to avoid overwriting the 'setMeetings' call at the end of the function
                    // logic is slightly complex because of async. 
                    // Simpler: Just allow the function to finish setting 'relevantMeetings' (which has 'saving'), 
                    // and the .then/.catch will trigger a re-render later.
                }
            }

            setMeetings(relevantMeetings);
        } catch (err: any) {
            setError(err.message || 'Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 rounded-2xl animate-pulse border-2 border-purple-200 shadow-md"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 bg-red-600 rounded-2xl border-2 border-red-700 shadow-xl">
                <svg className="w-12 h-12 text-white mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white text-sm font-bold mb-3">{error}</p>
                <button
                    onClick={loadMeetings}
                    className="mt-2 px-5 py-2.5 bg-white text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="text-center py-12 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl border-2 border-purple-300 shadow-lg">
                <svg className="w-20 h-20 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-800 font-black text-lg">No upcoming meetings</p>
                <p className="text-gray-600 text-sm mt-2 font-semibold">Your schedule is clear!</p>
            </div>
        );
    }

    return (
        <div className="pb-4">
            {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
        </div>
    );
};
