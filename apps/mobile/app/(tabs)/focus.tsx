import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme'

type Phase = 'work' | 'break'
const MODES = [
  { label: '25/5',  workMin: 25, breakMin: 5,  name: 'Classic'   },
  { label: '50/10', workMin: 50, breakMin: 10, name: 'Deep Work' },
  { label: '90/20', workMin: 90, breakMin: 20, name: 'Ultra'     },
]

export default function FocusScreen() {
  const [modeIdx,  setModeIdx]  = useState(0)
  const [phase,    setPhase]    = useState<Phase>('work')
  const [seconds,  setSeconds]  = useState(25 * 60)
  const [running,  setRunning]  = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)

  const mode      = MODES[modeIdx]
  const total     = (phase === 'work' ? mode.workMin : mode.breakMin) * 60
  const progress  = 1 - seconds / total
  const minutes   = Math.floor(seconds / 60)
  const secs      = seconds % 60
  const timeStr   = `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`

  const nextPhase = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    if (phase === 'work') {
      setSessions(s => s + 1)
      setPhase('break')
      setSeconds(mode.breakMin * 60)
    } else {
      setPhase('work')
      setSeconds(mode.workMin * 60)
    }
    setRunning(false)
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(intervalRef.current!); nextPhase(); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, phase, modeIdx])

  const reset = () => {
    setRunning(false)
    setPhase('work')
    setSeconds(mode.workMin * 60)
  }

  const switchMode = (i: number) => {
    setModeIdx(i)
    setRunning(false)
    setPhase('work')
    setSeconds(MODES[i].workMin * 60)
    setSessions(0)
  }

  // Circular ring values (SVG-like using View)
  const ringSize     = 220
  const strokeWidth  = 10
  const radius       = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset   = circumference * (1 - progress)

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>

        <Text style={s.heading}>Focus Timer</Text>
        <Text style={s.sub}>{phase === 'work' ? mode.name + ' Session' : '☕ Break Time'}</Text>

        {/* Mode selector */}
        <View style={s.modeRow}>
          {MODES.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[s.modeBtn, i===modeIdx && s.modeBtnActive]}
              onPress={() => switchMode(i)}
              activeOpacity={0.7}
            >
              <Text style={[s.modeBtnText, i===modeIdx && s.modeBtnTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer ring — using simple View-based circle */}
        <View style={[s.ringOuter, { width: ringSize, height: ringSize }]}>
          <View style={s.ringBg} />
          <View style={s.ringCenter}>
            <Text style={s.timeText}>{timeStr}</Text>
            <Text style={s.phaseLabel}>{phase === 'work' ? 'Focus' : 'Break'}</Text>
          </View>
        </View>

        {/* Session dots */}
        <View style={s.sessionDots}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={[s.dot, i < sessions % 4 && s.dotDone, i === sessions % 4 && running && s.dotActive]}
            />
          ))}
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity style={s.ctrlBtn} onPress={reset} activeOpacity={0.8}>
            <Text style={s.ctrlBtnText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.startBtn, { backgroundColor: phase==='work' ? Colors.accent : Colors.teal }]}
            onPress={() => { Haptics.impactAsync(); setRunning(r => !r) }}
            activeOpacity={0.85}
          >
            <Text style={s.startBtnText}>{running ? 'Pause' : 'Start'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.ctrlBtn} onPress={nextPhase} activeOpacity={0.8}>
            <Text style={s.ctrlBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{sessions}</Text>
            <Text style={s.statLabel}>Sessions today</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{sessions * mode.workMin}m</Text>
            <Text style={s.statLabel}>Focus time</Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bgBase },
  container:      { flex: 1, alignItems: 'center', paddingTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  heading:        { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  sub:            { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  modeRow:        { flexDirection: 'row', gap: 8, marginBottom: Spacing.xxxl },
  modeBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderSubtle },
  modeBtnActive:  { borderColor: Colors.accent, backgroundColor: Colors.accentBg },
  modeBtnText:    { fontSize: FontSize.sm, color: Colors.textMuted },
  modeBtnTextActive: { color: Colors.accentLight, fontWeight: '600' },
  ringOuter:      { alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  ringBg:         { position: 'absolute', inset: 0, borderRadius: 110, borderWidth: 10, borderColor: Colors.bgHover },
  ringCenter:     { alignItems: 'center' },
  timeText:       { fontSize: 52, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -2 },
  phaseLabel:     { fontSize: FontSize.sm, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  sessionDots:    { flexDirection: 'row', gap: 10, marginBottom: Spacing.xxxl },
  dot:            { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.bgHover, borderWidth: 1, borderColor: Colors.borderSubtle },
  dotDone:        { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dotActive:      { backgroundColor: Colors.accentLight, borderColor: Colors.accentLight },
  controls:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxxl },
  ctrlBtn:        { height: 48, paddingHorizontal: Spacing.xl, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  ctrlBtnText:    { fontSize: FontSize.sm, color: Colors.textSecondary },
  startBtn:       { height: 56, paddingHorizontal: Spacing.xxxl, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  startBtnText:   { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
  statsRow:       { flexDirection: 'row', gap: 12, width: '100%' },
  statCard:       { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderFaint },
  statValue:      { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  statLabel:      { fontSize: 11, color: Colors.textMuted },
})
