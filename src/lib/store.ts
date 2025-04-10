"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Task, Priority, SubTask } from "./types"

interface TaskState {
  tasks: Task[]
  activeTaskId: string | null
  addTask: (title: string, priority?: Priority, setActive?: boolean) => string
  updateTask: (task: Task) => void
  deleteTask: (id: string) => void
  toggleTaskCompletion: (id: string) => void
  addSubTask: (taskId: string, title: string) => void
  updateSubTask: (taskId: string, subTask: SubTask) => void
  deleteSubTask: (taskId: string, subTaskId: string) => void
  toggleSubTaskCompletion: (taskId: string, subTaskId: string) => void
  setActiveTaskId: (id: string | null) => void
  getActiveTask: () => Task | null
  reorderTasks: (oldIndex: number, newIndex: number) => void
  reorderSubTasks: (taskId: string, oldIndex: number, newIndex: number) => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeTaskId: null,

      addTask: (title, priority = "medium", setActive = true) => {
        const id = crypto.randomUUID()
        const newTask: Task = {
          id,
          title,
          priority,
          completed: false,
          createdAt: new Date().toISOString(),
          subTasks: [],
        }

        set((state) => ({
          tasks: [newTask, ...state.tasks],
          activeTaskId: setActive ? id : state.activeTaskId,
        }))

        return id
      },

      updateTask: (updatedTask) => {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
        }))
      },

      toggleTaskCompletion: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
        }))
      },

      addSubTask: (taskId, title) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                subTasks: [
                  ...task.subTasks,
                  {
                    id: crypto.randomUUID(),
                    title,
                    completed: false,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            }
            return task
          }),
        }))
      },

      updateSubTask: (taskId, updatedSubTask) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                subTasks: task.subTasks.map((subTask) => (subTask.id === updatedSubTask.id ? updatedSubTask : subTask)),
              }
            }
            return task
          }),
        }))
      },

      deleteSubTask: (taskId, subTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                subTasks: task.subTasks.filter((subTask) => subTask.id !== subTaskId),
              }
            }
            return task
          }),
        }))
      },

      toggleSubTaskCompletion: (taskId, subTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                subTasks: task.subTasks.map((subTask) =>
                  subTask.id === subTaskId ? { ...subTask, completed: !subTask.completed } : subTask,
                ),
              }
            }
            return task
          }),
        }))
      },

      setActiveTaskId: (id) => {
        set({ activeTaskId: id })
      },

      getActiveTask: () => {
        const { tasks, activeTaskId } = get()
        return tasks.find((task) => task.id === activeTaskId) || null
      },

      reorderTasks: (oldIndex, newIndex) => {
        set((state) => {
          const newTasks = [...state.tasks]
          const [movedTask] = newTasks.splice(oldIndex, 1)
          newTasks.splice(newIndex, 0, movedTask)
          return { tasks: newTasks }
        })
      },

      reorderSubTasks: (taskId, oldIndex, newIndex) => {
        set((state) => {
          const newTasks = state.tasks.map((task) => {
            if (task.id === taskId) {
              const newSubTasks = [...task.subTasks]
              const [movedSubTask] = newSubTasks.splice(oldIndex, 1)
              newSubTasks.splice(newIndex, 0, movedSubTask)
              return { ...task, subTasks: newSubTasks }
            }
            return task
          })
          return { tasks: newTasks }
        })
      },
    }),
    {
      name: "voice-todo-storage",
    },
  ),
)
