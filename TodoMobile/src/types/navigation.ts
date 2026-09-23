import { Todo } from './todo';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  AddTodo: undefined;
  EditTodo: { todo: Todo };
};
