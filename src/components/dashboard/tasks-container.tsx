"use client"

import { QuickAdd } from "@/components/tasks/quick-add"
import { TaskList } from "@/components/tasks/task-list"
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks"

export function TasksContainer({ userId, partnerId }: { userId: string, partnerId?: string | null }) {
    const { tasks, loading, addTask, updateTask, deleteTask } = useRealtimeTasks(userId, partnerId)

    return (
        <div className="space-y-8">
            {/* Quick Add Task */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Quick Create</h2>
                <QuickAdd onAddTask={addTask} />
            </div>

            {/* Task List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Focus</h2>
                {/* We pass the data and handlers down so TaskList doesn't need to fetch again */}
                <TaskList
                    userId={userId}
                    partnerId={partnerId}
                    propTasks={tasks}
                    propLoading={loading}
                    propUpdateTask={updateTask}
                    propDeleteTask={deleteTask}
                />
            </div>
        </div>
    )
}
