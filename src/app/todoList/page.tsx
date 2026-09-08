"use client";
import { TodoList } from "@/Components/TodoList/TodoList";
import { useAuthState } from "@/utils/Route Protection/useAuthState";

const TodoListPage = () => {
  const { user, loading } = useAuthState();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <TodoList user={user} />
    </div>
  );
};

export default TodoListPage;
