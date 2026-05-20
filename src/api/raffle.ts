import apiClient from './client';

export interface RaffleTicket {
  ticket_number: number;
  source: string;
  created_at: string;
}

export const raffleApi = {
  getMyTickets: async (): Promise<{ tickets: RaffleTicket[] }> => {
    const response = await apiClient.get<{ tickets: RaffleTicket[] }>('/cabinet/raffle/my-tickets');
    return response.data;
  },
};
