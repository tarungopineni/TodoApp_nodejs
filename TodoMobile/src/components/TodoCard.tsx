import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Todo } from '../types/todo';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface TodoCardProps {
  todo: Todo;
  onToggleComplete: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todoId: number | string) => void;
}

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const handleDeletePress = () => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${todo.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(todo.id),
        },
      ],
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.card, todo.complete && styles.completedCard]}>
      {/* Top Header Row: Priority & Status */}
      <View style={styles.badgeRow}>
        <PriorityBadge priority={todo.priority} />
        <StatusBadge complete={todo.complete} />
      </View>

      {/* Title & Checkbox Row */}
      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.checkboxTouch}
          onPress={() => onToggleComplete(todo)}>
          <View
            style={[
              styles.checkbox,
              todo.complete && styles.checkboxChecked,
            ]}>
            {todo.complete && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <Text
          style={[styles.title, todo.complete && styles.completedTitleText]}
          numberOfLines={2}>
          {todo.title}
        </Text>
      </View>

      {/* Description */}
      {!!todo.description && (
        <Text
          style={[
            styles.description,
            todo.complete && styles.completedDescriptionText,
          ]}
          numberOfLines={3}>
          {todo.description}
        </Text>
      )}

      {/* Dates Section */}
      {(todo.task_datetime || todo.deadline) && (
        <View style={styles.datesContainer}>
          {todo.task_datetime && (
            <Text style={styles.dateText}>
              📅 Task Date: {formatDate(todo.task_datetime)}
            </Text>
          )}
          {todo.deadline && (
            <Text style={[styles.dateText, styles.deadlineText]}>
              ⏰ Deadline: {formatDate(todo.deadline)}
            </Text>
          )}
        </View>
      )}

      {/* Footer Action Buttons */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(todo)}>
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDeletePress}>
          <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  completedCard: {
    backgroundColor: '#F8FAFC',
    borderLeftColor: '#22C55E',
    opacity: 0.9,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkboxTouch: {
    paddingRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  completedTitleText: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 10,
    lineHeight: 20,
    paddingLeft: 32,
  },
  completedDescriptionText: {
    color: '#94A3B8',
  },
  datesContainer: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
    marginLeft: 32,
  },
  dateText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginVertical: 2,
  },
  deadlineText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    marginLeft: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});
