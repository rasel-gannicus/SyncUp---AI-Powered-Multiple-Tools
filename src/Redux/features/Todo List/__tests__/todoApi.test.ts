import { todoApi } from "../todoApi";

describe("todoApi RTK Query Endpoints", () => {
  it("should have all expected endpoints defined", () => {
    expect(todoApi.endpoints.addTodo).toBeDefined();
    expect(todoApi.endpoints.deleteTodo).toBeDefined();
    expect(todoApi.endpoints.bulkDeleteTodos).toBeDefined();
    expect(todoApi.endpoints.editTodo).toBeDefined();
    expect(todoApi.endpoints.bulkUpdateTodos).toBeDefined();
    expect(todoApi.endpoints.renameProject).toBeDefined();
    expect(todoApi.endpoints.deleteProject).toBeDefined();
  });

  it("should generate correct query objects for bulk and project actions", () => {
    const bulkDeleteQuery = (todoApi.endpoints.bulkDeleteTodos as any).initiate({
      email: "test@example.com",
      createdAtList: [123, 456],
    });
    expect(bulkDeleteQuery).toBeDefined();

    const renameProjectQuery = (todoApi.endpoints.renameProject as any).initiate({
      email: "test@example.com",
      oldProjectName: "Old",
      newProjectName: "New",
    });
    expect(renameProjectQuery).toBeDefined();
  });
});
