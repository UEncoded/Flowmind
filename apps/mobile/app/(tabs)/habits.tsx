import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import * as Haptics from 'expo-haptics'
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme'
import type { Habit } from '../../src/constants/shared'

const API = 'https://flowmind-backend-64ix.onrender.com'

export default function HabitsScreen() {
  const qc = useQueryClient()

  const { data: habits = [] } = useQuery<(Habit & { completedToday: boolean })[]>({
    queryKey: ['habits-today'],
    queryFn:  () => axios.get(`${API}/api/habits/today`).then(r => r.data),
    refetchInterval: 60_000,
  })

  const logHabit = useMutation({
    mutationFn: (habit: Habit & { completedToday: boolean }) =>
      axios.post(`${API}/api/habits/${habit.id}/log`, { completed: !habit.completedToday }),
    onMutate:  () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits-today'] }),
  })

  const completed = habits.filter(h => h.completedToday).length
  const total     = habits.length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.heading}>Habits</Text>
        <Text style={s.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</Text>
      </View>

      {/* Progress */}
      <View style={s.progressCard}>
        <View style={s.progressTop}>
          <Text style={s.progressLabel}>{completed}/{total} habits done today</Text>
          <Text style={s.progressPct}>{pct}%</Text>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${pct}%` as any }]} />
        </View>
        {pct === 100 && (
          <Text style={s.congrats}>🎉 Perfect day! All habits complete.</Text>
        )}
      </View>

      <FlatList
        data={habits}
        keyExtractor={h => h.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[s.habitRow, item.completedToday && s.habitDone]}>
            <Text style={s.habitIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.habitName, item.completedToday && s.habitNameDone]}>{item.name}</Text>
              {item.streak ? (
                <Text style={s.streakText}>🔥 {item.streak}-day streak</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={[
                s.logBtn,
                {
                  borderColor: item.color,
                  backgroundColor: item.completedToday ? item.color : 'transparent',
                },
              ]}
              onPress={() => logHabit.mutate(item)}
              activeOpacity={0.7}
            >
              <Text style={[s.logBtnText, item.completedToday && { color: '#fff' }]}>
                {item.completedToday ? '✓' : 'Log'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🌱</Text>
            <Text style={s.emptyText}>No habits yet. Add some in Settings.</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bgBase },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  heading:       { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  date:          { fontSize: FontSize.sm, color: Colors.textMuted },
  progressCard:  { marginHorizontal: Spacing.xl, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.borderFaint },
  progressTop:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  progressLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  progressPct:   { fontSize: FontSize.sm, fontWeight: '700', color: Colors.accent },
  progressTrack: { height: 6, backgroundColor: Colors.bgHover, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, backgroundColor: Colors.accent, borderRadius: 3 },
  congrats:      { fontSize: FontSize.sm, color: Colors.green, marginTop: Spacing.md, textAlign: 'center' },
  list:          { paddingHorizontal: Spacing.xl, paddingBottom: 24 },
  habitRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint },
  habitDone:     { opacity: 0.75 },
  habitIcon:     { fontSize: 24, width: 36, textAlign: 'center' },
  habitName:     { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '500', marginBottom: 3 },
  habitNameDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  streakText:    { fontSize: FontSize.xs, color: Colors.amber },
  logBtn:        { width: 56, height: 32, borderRadius: Radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  logBtnText:    { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyText:     { fontSize: FontSize.sm, color: Colors.textMuted },
})