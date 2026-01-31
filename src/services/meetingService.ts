import { api } from './api';
import type { Meeting } from '../types/meeting';
import type { MeetingsResponse } from '../types/meeting';

export const meetingService = {
    getMeetings: async (): Promise<Meeting[]> => {
        const response: MeetingsResponse = await api.get('/meetings');

        // Combine all meetings into a single list
        const allMeetings = [
            ...response.joined_team_meetings,
            ...response.missed_team_meetings,
            ...response.private_meetings
        ];

        // Filter and sort: Upcoming only (or recent active), sorted by start time
        // For now, let's just return them all sorted, component can filter
        return allMeetings.sort((a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
    },

    joinMeetingWithAgent: async (meetingId: string) => {
        return api.post(`/meetings/${meetingId}/join-agent`, {});
    },

    catchMeUp: async (meetingId: string) => {
        return api.post('/agent/catch-me-up', { meeting_id: meetingId });
    },

    createAdHocMeeting: async (meetingUrl: string, title: string = 'Ad-Hoc Meeting'): Promise<Meeting> => {
        const now = new Date();
        const endTime = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour duration

        return api.post('/meetings', {
            title,
            meeting_url: meetingUrl,
            location: meetingUrl, // Fallback: some backends use location for the link
            start_time: now.toISOString(),
            end_time: endTime.toISOString(),
            description: 'Automatically detected ad-hoc meeting'
        });
    },

    // Meeting Notes API
    getMeetingNote: async (meetingId: string): Promise<{ content: string }> => {
        return api.get(`/meetings/${meetingId}/notes`);
    },

    saveMeetingNote: async (meetingId: string, content: string): Promise<void> => {
        await api.post(`/meetings/${meetingId}/notes`, { content });
    },

    deleteMeetingNote: async (meetingId: string): Promise<void> => {
        await api.delete(`/meetings/${meetingId}/notes`);
    },

    smartTranscriptSearch: async (meetingId: string, query: string): Promise<any> => {
        return api.post('/search/smart', { meeting_id: meetingId, query });
    }
};
