export interface Attendee {
    email: string;
    response_status?: string;
    display_name?: string;
}

export interface Meeting {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    meeting_url?: string;
    description?: string;
    location?: string;
    attendees?: Attendee[];
    organizer_email?: string;
    organizer_name?: string;
    summary?: string;
    bot_status?: string; // 'joining' | 'joined' | 'left' | 'failed' | null
    auto_bot_enabled?: boolean;
    _status?: 'saving' | 'saved' | 'failed'; // Frontend-only tracking
}

export interface MeetingsResponse {
    joined_team_meetings: Meeting[];
    missed_team_meetings: Meeting[];
    private_meetings: Meeting[];
}
