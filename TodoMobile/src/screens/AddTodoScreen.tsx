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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { todosApi } from '../services/api';
import { CustomButton } from '../components/CustomButton';
import { DateTimePickerInput } from '../components/DateTimePickerInput';
import { RootStackParamList } from '../types/navigation';
import { getErrorMessage } from '../utils/error';

type AddTodoScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddTodo'
>;

interface Props {
  navigation: AddTodoScreenNavigationProp;
}

export const AddTodoScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<number>(3);
  const [taskDatetime, setTaskDatetime] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleCreate = async () => {
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
      await todosApi.createTodo({
        title: title.trim(),
        description: description.trim(),
        priority: priority,
        complete: false,
        task_datetime: taskDatetime ? taskDatetime.toISOString() : null,
        deadline: deadline ? deadline.toISOString() : null,
      });

      Alert.alert('Success', 'Task created successfully!');
      navigation.goBack();
    } catch (err: any) {
      console.error('Create todo error:', err);
      setErrorMsg(getErrorMessage(err, 'Failed to create task.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Navigation Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Create New Task</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Learn React Native"
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
              placeholder="e.g. Build mobile app UI"
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
            label="Scheduled Task Date & Time (Optional)"
            value={taskDatetime}
            onChange={setTaskDatetime}
            placeholder="Select Task Date & Time"
          />

          {/* Deadline Date/Time Picker */}
          <DateTimePickerInput
            label="Deadline / Due Date (Optional)"
            value={deadline}
            onChange={setDeadline}
            placeholder="Select Deadline"
          />

          {/* Submit Button */}
          <CustomButton
            title="Create Task"
            onPress={handleCreate}
            loading={loading}
            style={styles.submitBtn}
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
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
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
});
