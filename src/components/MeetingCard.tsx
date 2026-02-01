import React, { useState, useEffect } from 'react';
import type { Meeting } from '../types/meeting';
import { meetingService } from '../services/meetingService';

interface MeetingCardProps {
    meeting: Meeting;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
    const [loading, setLoading] = useState(false);
    const [botStatus, setBotStatus] = useState(meeting.bot_status);
    const [summary, setSummary] = useState<string | null>(null);
    const [notes, setNotes] = useState<string>('');
    const [showNotes, setShowNotes] = useState(false);
    const [notesLoading, setNotesLoading] = useState(false);

    // Search state
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[] | null>(null);

    const currentUrl = window.location.href;
    const isOnCall = !!(meeting.meeting_url && currentUrl.includes(meeting.meeting_url));
    const joinDisabled = !meeting.meeting_url || isOnCall;

    // Load notes from API
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const response = await meetingService.getMeetingNote(meeting.id);
                if (response && response.content) {
                    setNotes(response.content);
                }
            } catch (error) {
                console.log('No notes found for meeting', meeting.id);
            }
        };
        loadNotes();
    }, [meeting.id]);



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

    const isToday = now.toDateString() === startTime.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = tomorrow.toDateString() === startTime.toDateString();

    let dateStr = '';
    if (isToday) dateStr = 'Today';
    else if (isTomorrow) dateStr = 'Tomorrow';
    else dateStr = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const timeStr = `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const fullDateTime = `${dateStr} • ${timeStr}`;

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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResults(null);
        try {
            const result = await meetingService.smartTranscriptSearch(meeting.id, searchQuery);
            if (result.success) {
                setSearchResults(result.results);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Button styles
    const btnBase: React.CSSProperties = {
        flex: 1,
        fontWeight: 700,
        fontSize: '13px',
        padding: '12px 16px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'opacity 0.2s',
    };

    const getJoinBtnStyle = (): React.CSSProperties => {
        if (isOnCall) return { ...btnBase, background: '#16a34a', color: '#fff', cursor: 'default' };
        if (joinDisabled) return { ...btnBase, background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed' };
        return { ...btnBase, background: '#2563eb', color: '#fff' };
    };

    const getBotBtnStyle = (): React.CSSProperties => {
        if (botStatus === 'joined' || botStatus === 'joining')
            return { ...btnBase, background: '#16a34a', color: '#fff', cursor: 'default' };
        if (botStatus === 'failed')
            return { ...btnBase, background: '#dc2626', color: '#fff' };
        return { ...btnBase, background: '#7c3aed', color: '#fff' };
    };

    return (
        <div style={{
            background: '#ffffff',
            border: '2px solid #e5e7eb',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '14px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
            {/* Accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#7c3aed' }} />

            {/* Header */}
            <div className="flex justify-between items-start" style={{ marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '15px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={meeting.title}>
                        {meeting.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1" style={{ fontSize: '12px', color: '#4b5563' }}>
                            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span style={{ fontWeight: 600 }}>{fullDateTime}</span>
                        </div>
                        {meeting._status === 'saving' && (
                            <span style={{ fontSize: '11px', color: '#a16207', background: '#fef3c7', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Saving...</span>
                        )}
                        {meeting._status === 'failed' && (
                            <span style={{ fontSize: '11px', color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Save Failed</span>
                        )}
                        {meeting._status === 'saved' && (
                            <span style={{ fontSize: '11px', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Saved</span>
                        )}
                    </div>
                </div>
                {isActive && (
                    <span style={{ background: '#16a34a', color: '#fff', fontSize: '11px', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '7px', height: '7px', background: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                        LIVE
                    </span>
                )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2" style={{ marginTop: '14px' }}>
                {/* Join Meeting */}
                <button
                    onClick={() => meeting.meeting_url && window.open(meeting.meeting_url, '_blank')}
                    disabled={!!joinDisabled}
                    style={getJoinBtnStyle()}
                >
                    {isOnCall ? '✓ On Call' : 'Join Now'}
                </button>

                {/* Send Bot */}
                {(botStatus === 'joined' || botStatus === 'joining') ? (
                    <button disabled style={getBotBtnStyle()}>
                        <svg style={{ width: '14px', height: '14px' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {botStatus === 'joining' ? 'Joining...' : 'Bot Active'}
                    </button>
                ) : botStatus === 'failed' ? (
                    <button onClick={handleJoin} disabled={loading} style={getBotBtnStyle()}>
                        {loading ? '...' : 'Retry Bot'}
                    </button>
                ) : (
                    <button onClick={handleJoin} disabled={loading} style={getBotBtnStyle()} title="Send Mia to take notes">
                        {loading ? (
                            <span>...</span>
                        ) : (
                            <>
                                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                Send Bot
                            </>
                        )}
                    </button>
                )}

                {/* Catch Me Up */}
                {isActive && (
                    <button
                        onClick={handleCatchMeUp}
                        disabled={loading}
                        style={{ ...btnBase, flex: 'none', padding: '12px', background: '#2563eb', color: '#fff' }}
                        title="Catch Me Up"
                    >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </button>
                )}

                {/* Search Toggle */}
                {isActive && (
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        disabled={loading}
                        style={{ ...btnBase, flex: 'none', padding: '12px', background: showSearch ? '#3b82f6' : '#f3f4f6', color: showSearch ? '#fff' : '#4b5563' }}
                        title="Search Transcript"
                    >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                )}
            </div>

            {/* Search Section */}
            {showSearch && (
                <div style={{ marginTop: '14px', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search in conversation..."
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                fontFamily: 'inherit',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600
                            }}
                        >
                            {isSearching ? '...' : 'Go'}
                        </button>
                    </form>

                    {searchResults && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {searchResults.length > 0 ? (
                                searchResults.map((result: any, idx: number) => (
                                    <div key={idx} style={{ padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                                            <span style={{ fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>{result.speaker}</span>
                                            <span style={{ color: '#94a3b8' }}>{Math.round(result.score * 100)}%</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#334155', margin: 0, fontStyle: 'italic' }}>"{result.text}"</p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '4px 0' }}>No results found.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            {summary && (
                <div style={{ marginTop: '14px', padding: '14px', background: '#2563eb', borderRadius: '12px', color: '#fff', fontSize: '13px' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#bfdbfe' }}>Summary</span>
                        <button onClick={() => setSummary(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}>&times;</button>
                    </div>
                    <p style={{ lineHeight: 1.6, fontWeight: 500 }}>{summary}</p>
                </div>
            )}

            {/* Notes */}
            <div style={{ marginTop: '14px' }}>
                <button
                    onClick={() => setShowNotes(!showNotes)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#374151',
                        cursor: 'pointer',
                    }}
                >
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>{showNotes ? 'Hide Notes' : 'Personal Notes'}</span>
                    {notes && !showNotes && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', background: '#7c3aed', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>Has notes</span>
                    )}
                </button>

                {showNotes && (
                    <div style={{ marginTop: '10px', padding: '14px', background: '#f5f3ff', borderRadius: '12px', border: '2px solid #c4b5fd' }}>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add your personal notes about this meeting..."
                            style={{
                                width: '100%',
                                background: '#fff',
                                color: '#1f2937',
                                fontSize: '13px',
                                borderRadius: '8px',
                                padding: '12px',
                                border: '2px solid #c4b5fd',
                                outline: 'none',
                                resize: 'none',
                                fontWeight: 500,
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                minHeight: '120px'
                            }}
                            rows={6}
                        />
                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={async () => {
                                    setNotesLoading(true);
                                    try {
                                        await meetingService.saveMeetingNote(meeting.id, notes);
                                    } catch (error) {
                                        console.error('Failed to save note:', error);
                                    } finally {
                                        setNotesLoading(false);
                                    }
                                }}
                                disabled={notesLoading}
                                style={{
                                    background: notesLoading ? '#d1d5db' : '#7c3aed',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    cursor: notesLoading ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {notesLoading ? 'Saving...' : (
                                    <>
                                        <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        Save Notes
                                    </>
                                )}
                            </button>

                            <span style={{ fontSize: '10px', color: '#6d28d9', fontStyle: 'italic' }}>
                                Don't forget to save!
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
