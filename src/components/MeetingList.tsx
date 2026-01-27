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

            // 1. Filter: Show future, active bot, or *matches current page*
            // This ensures "past" meetings that you are currently attending are still visible.
            let relevantMeetings = allMeetings.filter(m => {
                const isFuture = new Date(m.end_time) > now;
                const isBotActive = m.bot_status === 'joining' || m.bot_status === 'joined';
                // If we are ON the page of a past meeting, show it so we can use the bot!
                const isCurrentPage = m.meeting_url && currentUrl.includes(m.meeting_url);

                return isFuture || isBotActive || isCurrentPage;
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
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse border border-gray-700"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-6">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                    onClick={loadMeetings}
                    className="mt-2 text-blue-400 hover:text-blue-300 hover:underline text-sm"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">No upcoming meetings.</p>
            </div>
        );
    }

    return (
        <div className="pb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h2>
            {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
        </div>
    );
};
