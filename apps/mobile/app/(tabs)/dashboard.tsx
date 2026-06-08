import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme'
import { useAuthStore } from '../../src/store/authStore'

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[s.metricCard, { borderTopColor: color }]}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  )
}

const QUICK_LINKS = [
  { emoji:'✅', label:'Tasks',    route:'/(tabs)/tasks'   },
  { emoji:'⏱️', label:'Focus',    route:'/(tabs)/focus'   },
  { emoji:'👥', label:'Meetings', route:'/meetings'       },
  { emoji:'📅', label:'Schedule', route:'/schedule'       },
  { emoji:'📊', label:'Stats',    route:'/analytics'      },
  { emoji:'⚙️', label:'Settings', route:'/settings'       },
]

export default function DashboardScreen() {
  const { user } = useAuthStore()

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn:  () => axios.get(`${API}/api/analytics/overview`).then(r => r.data),
    refetchInterval: 60_000,
  })

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  const focusHours = overview?.focus?.minutesToday
    ? `${Math.floor(overview.focus.minutesToday / 60)}h ${overview.focus.minutesToday % 60}m`
    : '0m'

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting()}, {user?.name?.split(' ')[0]} ☀️</Text>
            <Text style={s.date}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
            </Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(user?.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Metrics */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.metricsScroll}>
          <View style={s.metricsRow}>
            <MetricCard label="Tasks done"   value={`${overview?.tasks?.doneToday||0}`} color={Colors.accent} />
            <MetricCard label="Deep work"    value={focusHours}                          color={Colors.teal}   />
            <MetricCard label="AI streak"    value={`${overview?.aiStreak||0}d`}         color={Colors.amber}  />
            <MetricCard label="Habits done"  value={`${overview?.habits?.completedToday||0}`} color={Colors.coral} />
          </View>
        </ScrollView>

        {/* AI Insight card */}
        <TouchableOpacity style={s.aiCard} onPress={() => router.push('/(tabs)/ai')} activeOpacity={0.85}>
          <View style={s.aiTag}>
            <Text style={s.aiTagText}>✨ AI Insight</Text>
          </View>
          <Text style={s.aiText}>
            You're in your peak focus window. Tackle your hardest task now while energy is high.
          </Text>
          <Text style={s.aiAction}>Ask AI for personalised advice →</Text>
        </TouchableOpacity>

        {/* Quick links */}
        <Text style={s.sectionTitle}>Quick access</Text>
        <View style={s.quickGrid}>
          {QUICK_LINKS.map(({ emoji, label, route }) => (
            <TouchableOpacity
              key={route}
              style={s.quickCard}
              onPress={() => router.push(route as any)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
              <Text style={s.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mood */}
        <Text style={s.sectionTitle}>Today's mood</Text>
        <View style={s.moodRow}>
          {['😴','😞','😐','😊','🤩'].map((e, i) => (
            <TouchableOpacity key={i} style={s.moodBtn} activeOpacity={0.7}>
              <Text style={{ fontSize: 26 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bgBase },
  scroll:       { flex: 1 },
  content:      { paddingHorizontal: Spacing.xl, paddingBottom: 32 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.lg, marginBottom: Spacing.xl },
  greeting:     { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  date:         { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  avatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  metricsScroll:{ marginHorizontal: -Spacing.xl, marginBottom: Spacing.xl },
  metricsRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.xl, paddingVertical: 2 },
  metricCard:   { width: 110, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderTopWidth: 2 },
  metricLabel:  { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  metricValue:  { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  aiCard:       { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.accentBg },
  aiTag:        { flexDirection: 'row', marginBottom: 8 },
  aiTagText:    { fontSize: 11, color: Colors.accent, backgroundColor: Colors.accentBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm, fontWeight: '600' },
  aiText:       { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  aiAction:     { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md },
  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.xl },
  quickCard:    { width: '30%', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.borderFaint },
  quickLabel:   { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  moodRow:      { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md },
  moodBtn:      { alignItems: 'center', justifyContent: 'center', padding: 6 },
})
