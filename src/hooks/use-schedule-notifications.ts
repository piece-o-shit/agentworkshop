
import { useToast } from '@/components/ui/use-toast';

export function useScheduleNotifications() {
  const { toast } = useToast();

  return {
    notifySuccess: (title: string, description: string) => {
      toast({
        title,
        description
      });
    },
    notifyError: (error: unknown) => {
      console.error('Schedule operation failed:', error);
      toast({
        title: 'Error',
        description: 'Operation failed',
        variant: 'destructive'
      });
    }
  };
}
