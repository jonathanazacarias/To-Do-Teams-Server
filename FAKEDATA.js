export const listsList = [
  {
    id: "1",
    title: "List 1",
    description: "A list of thing to do",
    items: [
      {
        id: "1",
        title: "Get milk",
        description: "Go to the store to get milk",
      },
      {
        id: "2",
        title: "Get dog food",
        description: "Go to store for dog food",
      },
      {
        id: "3",
        title: "Walk dog",
        description: "Take the dog outside for a walk",
      },
    ],
    owner: { userId: "123456", userName: "jon", avatar: "" },
    contributers: [],
    created: "2024-04-14T14:30:15.449Z",
    modified: "2024-04-14T14:38:15.449Z",
    modifiedBy: { userId: "123456", userName: "jon", avatar: "" },
  },
  {
    id: "2",
    title: "List 2",
    description: "A list of thing to do",
    items: [
      {
        id: "1",
        title: "Get cheese",
        description: "Go to the store to get cheese",
      },
      {
        id: "2",
        title: "Get cat food",
        description: "Go to store for cat food",
      },
      {
        id: "3",
        title: "Walk cat",
        description: "Take the cat outside for a walk",
      },
    ],
    owner: { userId: "123456", userName: "jon", avatar: "" },
    contributers: [{ userId: "654321", userName: "car", avatar: "" }],
    created: "2024-04-14T14:30:15.449Z",
    modified: "2024-04-14T14:38:15.449Z",
    modifiedBy: { userId: "123456", userName: "jon", avatar: "" },
  },
];
