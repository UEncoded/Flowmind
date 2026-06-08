import { useState } from 'react'
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import * as Haptics from 'expo-haptics'
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme'
import type { Task, Priority } from '@flowmind/shared'

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: Colors.teal, MEDIUM: Colors.amber, HIGH: Colors.coral, URGENT: Colors.pink,
}

export default function TasksScreen() {
  const [showAdd,    setShowAdd]    = useState(false)
  const [newTitle,   setNewTitle]   = useState('')
  const [newPriority,setNewPriority]= useState<Priority>('MEDIUM')
  const [filter,     setFilter]     = useState<'all'|'todo'|'done'>('all')
  const qc = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn:  () => axios.get(`${API}/api/tasks`).then(r => r.data),
  })

  const addTask = useMutation({
    mutationFn: () => axios.post(`${API}/api/tasks`, { title: newTitle, priority: newPriority, status: 'TODO' }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:['tasks'] }); setShowAdd(false); setNewTitle('') },
  })

  const toggleTask = useMutation({
    mutationFn: (task: Task) =>
      axios.patch(`${API}/api/tasks/${task.id}`, { status: task.status==='DONE' ? 'TODO' : 'DONE' }),
    onMutate:   () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    onSuccess:  () => qc.invalidateQueries({ queryKey:['tasks'] }),
  })

  const deleteTask = (task: Task) => {
    Alert.alert('Delete task?', task.title, [
      { text:'Cancel', style:'cancel' },
      {
        text:'Delete', style:'destructive',
        onPress: () => {
          axios.delete(`${API}/api/tasks/${task.id}`)
            .then(() => qc.invalidateQueries({ queryKey:['tasks'] }))
        },
      },
    ])
  }

  const filtered = tasks.filter(t =>
    filter === 'all'  ? true :
    filter === 'todo' ? t.status !== 'DONE' :
    t.status === 'DONE'
  )

  const renderTask = ({ item }: { item: Task }) => (
    <View style={s.taskRow}>
      <TouchableOpacity onPress={() => toggleTask.mutate(item)} style={s.check} activeOpacity={0.7}>
        <View style={[s.checkBox, item.status==='DONE' && s.checkBoxDone]}>
          {item.status==='DONE' && <Text style={{ color:'#fff', fontSize:10, fontWeight:'800' }}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={[s.taskTitle, item.status==='DONE' && s.taskDone]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={s.taskMeta}>
          <View style={[s.priorityPill, { backgroundColor: PRIORITY_COLORS[item.priority] + '20' }]}>
            <Text style={[s.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority}</Text>
          </View>
          {item.dueDate && (
            <Text style={s.dueText}>📅 {new Date(item.dueDate).toLocaleDateString()}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={() => deleteTask(item)} style={s.deleteBtn} activeOpacity={0.7}>
        <Text style={{ fontSize: 14, color: Colors.textDisabled }}>✕</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.heading}>Tasks</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {(['all','todo','done'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter===f && s.filterBtnActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterText, filter===f && s.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'todo' ? 'To do' : 'Done'}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={s.countText}>{filtered.length} tasks</Text>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderTask}
        keyExtractor={t => t.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🎉</Text>
            <Text style={s.emptyText}>{filter==='done' ? 'No completed tasks yet' : 'No tasks — add one!'}</Text>
          </View>
        }
      />

      {/* Add task modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Task</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.base }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={s.modalInput}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="What needs to be done?"
            placeholderTextColor={Colors.textDisabled}
            multiline
            autoFocus
          />

          <Text style={s.modalLabel}>Priority</Text>
          <View style={s.priorityRow}>
            {(['LOW','MEDIUM','HIGH','URGENT'] as Priority[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[s.priorityBtn, newPriority===p && { backgroundColor: PRIORITY_COLORS[p]+'30', borderColor: PRIORITY_COLORS[p] }]}
                onPress={() => setNewPriority(p)}
                activeOpacity={0.7}
              >
                <Text style={[s.priorityBtnText, newPriority===p && { color: PRIORITY_COLORS[p] }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.saveBtn, !newTitle.trim() && { opacity:0.4 }]}
            onPress={() => newTitle.trim() && addTask.mutate()}
            disabled={!newTitle.trim() || addTask.isPending}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnText}>{addTask.isPending ? 'Saving…' : 'Add task'}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:              { flex:1, backgroundColor: Colors.bgBase },
  header:            { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.md },
  heading:           { fontSize: FontSize.xl, fontWeight:'800', color: Colors.textPrimary },
  addBtn:            { backgroundColor: Colors.accent, paddingHorizontal: Spacing.lg, height: 36, borderRadius: Radius.md, alignItems:'center', justifyContent:'center' },
  addBtnText:        { color:'#fff', fontSize: FontSize.sm, fontWeight:'600' },
  filterRow:         { flexDirection:'row', alignItems:'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, gap: 8 },
  filterBtn:         { paddingHorizontal: Spacing.md, height:30, borderRadius: Radius.pill, borderWidth:1, borderColor: Colors.borderSubtle, alignItems:'center', justifyContent:'center' },
  filterBtnActive:   { borderColor: Colors.accent, backgroundColor: Colors.accentBg },
  filterText:        { fontSize: FontSize.xs, color: Colors.textMuted },
  filterTextActive:  { color: Colors.accentLight, fontWeight:'600' },
  countText:         { marginLeft:'auto', fontSize: FontSize.xs, color: Colors.textDisabled },
  list:              { paddingHorizontal: Spacing.xl, paddingBottom: 24 },
  taskRow:           { flexDirection:'row', alignItems:'flex-start', paddingVertical: Spacing.md, borderBottomWidth:1, borderBottomColor: Colors.borderFaint, gap: Spacing.md },
  check:             { paddingTop: 2 },
  checkBox:          { width:20, height:20, borderRadius: Radius.sm, borderWidth:1.5, borderColor: Colors.borderDefault, alignItems:'center', justifyContent:'center' },
  checkBoxDone:      { backgroundColor: Colors.accent, borderColor: Colors.accent },
  taskTitle:         { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20, marginBottom: 5 },
  taskDone:          { textDecorationLine:'line-through', color: Colors.textMuted },
  taskMeta:          { flexDirection:'row', gap:6, alignItems:'center', flexWrap:'wrap' },
  priorityPill:      { paddingHorizontal:6, paddingVertical:2, borderRadius: Radius.sm },
  priorityText:      { fontSize:10, fontWeight:'600' },
  dueText:           { fontSize:10, color: Colors.textMuted },
  deleteBtn:         { padding: 6 },
  empty:             { alignItems:'center', paddingTop: 60 },
  emptyText:         { fontSize: FontSize.sm, color: Colors.textMuted },
  modal:             { flex:1, backgroundColor: Colors.bgSubtle, padding: Spacing.xl },
  modalHeader:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.xl },
  modalTitle:        { fontSize: FontSize.lg, fontWeight:'700', color: Colors.textPrimary },
  modalInput:        { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, color: Colors.textPrimary, fontSize: FontSize.base, minHeight: 80, borderWidth:1, borderColor: Colors.borderSubtle, marginBottom: Spacing.xl },
  modalLabel:        { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.md, textTransform:'uppercase', letterSpacing:0.5 },
  priorityRow:       { flexDirection:'row', gap:8, marginBottom: Spacing.xl },
  priorityBtn:       { flex:1, height:36, borderRadius: Radius.md, borderWidth:1, borderColor: Colors.borderSubtle, alignItems:'center', justifyContent:'center' },
  priorityBtnText:   { fontSize:11, color: Colors.textMuted, fontWeight:'600' },
  saveBtn:           { height:52, borderRadius: Radius.md, backgroundColor: Colors.accent, alignItems:'center', justifyContent:'center' },
  saveBtnText:       { color:'#fff', fontSize: FontSize.base, fontWeight:'600' },
})
