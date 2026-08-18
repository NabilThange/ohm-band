import { useEffect, useState, useCallback } from 'react';

export interface ProjectSummary {
    id: string;
    title: string;
    stage: string;
    createdAt?: string;
    updatedAt?: string;
    last_message_at?: string;
    created_at?: string;
}

export function useChatList(userId?: string) {
    const [chats, setChats] = useState<ProjectSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((p: any) => ({
                    ...p,
                    last_message_at: p.updatedAt || p.createdAt,
                    created_at: p.createdAt,
                }));
                setChats(mapped);
            }
        } catch (err) {
            console.error('[useChatList] Failed to load projects:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();

        // Listen for new chat creation events
        const handleProjectCreated = () => {
            loadProjects();
        };

        window.addEventListener('ohm-project-created', handleProjectCreated);
        return () => window.removeEventListener('ohm-project-created', handleProjectCreated);
    }, [loadProjects]);

    return { chats, isLoading, refreshChats: loadProjects };
}
