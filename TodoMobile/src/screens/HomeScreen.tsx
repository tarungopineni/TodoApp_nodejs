import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { todosApi } from '../services/api';
import { getErrorMessage } from '../utils/error';
import { Todo } from '../types/todo';
import { TodoCard } from '../components/TodoCard';
import { SummaryCard } from '../components/SummaryCard';
import { RootStackParamList } from '../types/navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

type FilterStatus = 'ALL' | 'PENDING' | 'COMPLETED';

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);

  const fetchTodos = async () => {
    try {
      const data = await todosApi.getTodos();
      setTodos(data);
    } catch (error: any) {
      console.error('Error fetching todos:', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to fetch tasks from server.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTodos();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTodos();
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedPayload = {
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        complete: !todo.complete,
        task_datetime: todo.task_datetime,
        deadline: todo.deadline,
      };
      await todosApi.updateTodo(todo.id, updatedPayload);
      // Optimistic update local state
      setTodos(prev =>
        prev.map(t =>
          t.id === todo.id ? { ...t, complete: !t.complete } : t,
        ),
      );
    } catch (error) {
      console.error('Error updating completion status:', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to update task status.'));
    }
  };

  const handleDeleteTodo = async (todoId: number | string) => {
    try {
      await todosApi.deleteTodo(todoId);
      setTodos(prev => prev.filter(t => t.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to delete task.'));
    }
  };

  const filteredTodos = todos.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && t.complete) ||
      (statusFilter === 'PENDING' && !t.complete);

    const matchesPriority =
      priorityFilter === null || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.complete).length;
  const pendingCount = totalCount - completedCount;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>
            Hello, {user?.first_name || user?.username || 'User'}! 👋
          </Text>
          <Text style={styles.subGreeting}>Manage your daily goals</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TodoCard
            todo={item}
            onToggleComplete={handleToggleComplete}
            onEdit={todo => navigation.navigate('EditTodo', { todo })}
            onDelete={handleDeleteTodo}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
          />
        }
        ListHeaderComponent={
          <>
            {/* Task Summary Card */}
            <SummaryCard
              total={totalCount}
              pending={pendingCount}
              completed={completedCount}
            />

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <View style={styles.filterRow}>
              {(['ALL', 'PENDING', 'COMPLETED'] as FilterStatus[]).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.chip,
                    statusFilter === status && styles.activeChip,
                  ]}
                  onPress={() => setStatusFilter(status)}>
                  <Text
                    style={[
                      styles.chipText,
                      statusFilter === status && styles.activeChipText,
                    ]}>
                    {status === 'ALL'
                      ? 'All Tasks'
                      : status === 'PENDING'
                      ? 'Pending'
                      : 'Completed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'Try matching a different keyword'
                  : 'Tap the + button below to create your first task!'}
              </Text>
            </View>
          )
        }
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddTodo')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subGreeting: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
});
