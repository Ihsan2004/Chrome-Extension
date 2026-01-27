import React, { useState } from 'react';
import type { Meeting } from '../types/meeting';
import { meetingService } from '../services/meetingService';

interface MeetingCardProps {
    meeting: Meeting;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
    const [loading, setLoading] = useState(false);
    const [botStatus, setBotStatus] = useState(meeting.bot_status);
    const [summary, setSummary] = useState<string | null>(null);

    const parseDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? new Date() : date;
        } catch {
            return new Date();
        }
    };

    const startTime = parseDate(meeting.start_time);
    const endTime = parseDate(meeting.end_time);
    const now = new Date();

    // Format Date & Time
    const isToday = now.toDateString() === startTime.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = tomorrow.toDateString() === startTime.toDateString();

    let dateStr = '';
    if (isToday) {
        dateStr = 'Today';
    } else if (isTomorrow) {
        dateStr = 'Tomorrow';
    } else {
        dateStr = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    const timeStr = `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const fullDateTime = `${dateStr} • ${timeStr}`;

    // Check if meeting is active (now within start/end time + buffer?)
    // Simple check: start <= now <= end
    const isActive = now >= startTime && now <= endTime;

    const handleJoin = async () => {
        setLoading(true);
        try {
            await meetingService.joinMeetingWithAgent(meeting.id);
            setBotStatus('joining');
        } catch (error) {
            console.error('Failed to join:', error);
            alert('Failed to join meeting');
        } finally {
            setLoading(false);
        }
    };

    const handleCatchMeUp = async () => {
        setLoading(true);
        try {
            const res: any = await meetingService.catchMeUp(meeting.id);
            setSummary(res.summary || res.message || 'No summary available.');
        } catch (error) {
            console.error('Catch me up failed:', error);
            alert('Failed to get summary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg mb-3">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-semibold text-white line-clamp-1" title={meeting.title}>{meeting.title}</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400 font-medium">{fullDateTime}</p>
                        {meeting._status === 'saving' && <span className="text-xs text-yellow-500 animate-pulse">• Saving...</span>}
                        {meeting._status === 'failed' && <span className="text-xs text-red-500">• Save Failed</span>}
                        {meeting._status === 'saved' && <span className="text-xs text-green-500">• Saved</span>}
                    </div>
                </div>
                {isActive && (
                    <span className="bg-green-900/40 text-green-400 border border-green-800 text-xs px-2 py-1 rounded-full animate-pulse">
                        Live
                    </span>
                )}
            </div>

            <div className="flex gap-2 mt-4">
                {/* 1. Join Meeting (User) */}
                {(() => {
                    const currentUrl = window.location.href;
                    // Check if we are already on the meeting URL (or close enough)
                    const isOnCall = !!(meeting.meeting_url && currentUrl.includes(meeting.meeting_url));
                    const isDisabled = !!(!meeting.meeting_url || isOnCall);

                    return (
                        <button
                            onClick={() => meeting.meeting_url && window.open(meeting.meeting_url, '_blank')}
                            disabled={isDisabled}
                            className={`flex-1 font-medium text-sm py-2 rounded-lg transition-colors shadow-sm ${isOnCall
                                ? 'bg-green-600 cursor-default text-white opacity-90'
                                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600'
                                }`}
                        >
                            {isOnCall ? 'On Call' : 'Join Now'}
                        </button>
                    );
                })()}

                {/* 2. Send Bot (Agent) */}
                {(botStatus === 'joined' || botStatus === 'joining') ? (
                    <button
                        className="flex-1 bg-green-900/20 text-green-400 border border-green-800 text-sm py-2 rounded-lg cursor-default font-medium flex items-center justify-center gap-1"
                        disabled
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {botStatus === 'joining' ? 'Joining...' : 'Bot Active'}
                    </button>
                ) : botStatus === 'failed' ? (
                    <button
                        onClick={handleJoin}
                        disabled={loading}
                        className="flex-1 bg-red-900/20 text-red-400 border border-red-800 hover:bg-red-900/40 text-sm py-2 rounded-lg cursor-pointer font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                        {loading ? (
                            <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        Retry Bot
                    </button>
                ) : (
                    <button
                        onClick={handleJoin}
                        disabled={loading}
                        className="flex-1 bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white font-medium text-sm py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                        title="Send Mia to take notes"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                Send Bot
                            </>
                        )}
                    </button>
                )}

                {isActive && (
                    <button
                        onClick={handleCatchMeUp}
                        disabled={loading}
                        className="p-2 border border-blue-900/50 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Catch Me Up"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                )}
            </div>

            {summary && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-sm text-gray-300 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Summary</span>
                        <button onClick={() => setSummary(null)} className="text-gray-500 hover:text-gray-300">&times;</button>
                    </div>
                    <p className="leading-relaxed">{summary}</p>
                </div>
            )}
        </div>
    );
};
