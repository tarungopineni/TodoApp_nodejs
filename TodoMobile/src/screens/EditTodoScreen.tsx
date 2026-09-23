import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { todosApi } from '../services/api';
import { getErrorMessage } from '../utils/error';
import { CustomButton } from '../components/CustomButton';
import { DateTimePickerInput } from '../components/DateTimePickerInput';
import { RootStackParamList } from '../types/navigation';

type EditTodoScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditTodo'
>;

type EditTodoScreenRouteProp = RouteProp<RootStackParamList, 'EditTodo'>;

interface Props {
  navigation: EditTodoScreenNavigationProp;
  route: EditTodoScreenRouteProp;
}

export const EditTodoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { todo } = route.params;

  const [title, setTitle] = useState<string>(todo.title || '');
  const [description, setDescription] = useState<string>(
    todo.description || '',
  );
  const [priority, setPriority] = useState<number>(todo.priority || 3);
  const [complete, setComplete] = useState<boolean>(todo.complete || false);
  const [taskDatetime, setTaskDatetime] = useState<Date | null>(
    todo.task_datetime ? new Date(todo.task_datetime) : null,
  );
  const [deadline, setDeadline] = useState<Date | null>(
    todo.deadline ? new Date(todo.deadline) : null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleUpdate = async () => {
    setErrorMsg('');
    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg('Title must be at least 3 characters long.');
      return;
    }

    if (!description.trim() || description.trim().length < 3) {
      setErrorMsg('Description must be at least 3 characters long.');
      return;
    }

    if (description.trim().length > 20) {
      setErrorMsg('Description cannot exceed 20 characters.');
      return;
    }

    if (taskDatetime && deadline && deadline < taskDatetime) {
      setErrorMsg('Deadline cannot be earlier than task date/time.');
      return;
    }

    setLoading(true);
    try {
      await todosApi.updateTodo(todo.id, {
        title: title.trim(),
        description: description.trim(),
        priority: priority,
        complete: complete,
        task_datetime: taskDatetime ? taskDatetime.toISOString() : null,
        deadline: deadline ? deadline.toISOString() : null,
      });

      Alert.alert('Success', 'Task updated successfully!');
      navigation.goBack();
    } catch (err: any) {
      console.error('Update todo error:', err);
      setErrorMsg(getErrorMessage(err, 'Failed to update task.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${todo.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await todosApi.deleteTodo(todo.id);
              Alert.alert('Deleted', 'Task deleted successfully.');
              navigation.goBack();
            } catch (err) {
              console.error('Delete todo error:', err);
              Alert.alert('Error', getErrorMessage(err, 'Failed to delete task.'));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top Bar Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Edit Task</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteTopBtn}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {/* Completion Status Toggle */}
          <View style={styles.switchRow}>
            <Text style={styles.label}>Mark as Completed</Text>
            <Switch
              value={complete}
              onValueChange={setComplete}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={complete ? '#22C55E' : '#94A3B8'}
            />
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Task title"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Description * (3-20 chars)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Task description"
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              maxLength={20}
            />
            <Text style={styles.charCount}>
              {description.length}/20
            </Text>
          </View>

          {/* Priority Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority Level (1 - 5)</Text>
            <View style={styles.priorityRow}>
              {[1, 2, 3, 4, 5].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.priorityBtn,
                    priority === level && styles.priorityBtnActive,
                  ]}
                  onPress={() => setPriority(level)}>
                  <Text
                    style={[
                      styles.priorityText,
                      priority === level && styles.priorityTextActive,
                    ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Task Date/Time Picker */}
          <DateTimePickerInput
            label="Scheduled Task Date & Time"
            value={taskDatetime}
            onChange={setTaskDatetime}
            placeholder="Select Task Date & Time"
          />

          {/* Deadline Picker */}
          <DateTimePickerInput
            label="Deadline / Due Date"
            value={deadline}
            onChange={setDeadline}
            placeholder="Select Deadline"
          />

          {/* Action Buttons */}
          <CustomButton
            title="Save Changes"
            onPress={handleUpdate}
            loading={loading}
            style={styles.submitBtn}
          />

          <CustomButton
            title="Delete Task"
            onPress={handleDelete}
            variant="danger"
            style={styles.deleteBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  deleteTopBtn: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityBtn: {
    flex: 0.18,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  priorityBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  priorityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  priorityTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    marginTop: 20,
  },
  deleteBtn: {
    marginTop: 10,
  },
});
