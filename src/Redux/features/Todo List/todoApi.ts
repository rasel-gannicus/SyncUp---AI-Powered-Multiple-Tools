import { apiSlice } from "../../api/apiSlice";

export const todoApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- add new todo
    addTodo: builder.mutation({
      query: (data) => ({
        url: "/addTodo",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),

    // --- delete a todo
    deleteTodo: builder.mutation({
      query: (data) => ({
        url: "/deleteTodo",
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),

    // --- bulk delete todos
    bulkDeleteTodos: builder.mutation({
      query: (data) => ({
        url: "/bulkDeleteTodos",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),

    // --- edit a todo
    editTodo: builder.mutation({
      query: (data) => ({
        url: "/editTodo",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),

    // --- bulk update todos
    bulkUpdateTodos: builder.mutation({
      query: (data) => ({
        url: "/bulkUpdateTodos",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),

    // --- rename a project
    renameProject: builder.mutation({
      query: (data) => ({
        url: "/renameProject",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),

    // --- delete a project
    deleteProject: builder.mutation({
      query: (data) => ({
        url: "/deleteProject",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),
  }),
});

export const {
  useAddTodoMutation,
  useDeleteTodoMutation,
  useBulkDeleteTodosMutation,
  useEditTodoMutation,
  useBulkUpdateTodosMutation,
  useRenameProjectMutation,
  useDeleteProjectMutation,
} = todoApi;