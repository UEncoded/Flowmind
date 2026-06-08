import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Radius, FontSize } from '../src/constants/theme'
import { useAuthStore } from '../src/store/authStore'
import { PERSONA_LABELS, PERSONA_DESCRIPTIONS, type UserPersona } from '@flowmind/shared'

const PERSONA_ICONS: Record<UserPersona, string> = {
  remote_worker: '🏠', hybrid_worker: '🔄', onsite_worker: '🏢',
  student: '🎓', business_owner: '💼', homemaker: '🏡',
  job_seeker: '🔍', freelancer: '⚡', other: '✨',
}

const PERSONAS = Object.entries(PERSONA_LABELS) as [UserPersona, string][]

export default function SignupScreen() {
  const [step,     setStep]     = useState<1|2>(1)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [persona,  setPersona]  = useState<UserPersona>('other')
  const [error,    setError]    = useState('')
  const { signup, isLoading }   = useAuthStore()

  const handleSubmit = async () => {
    setError('')
    try {
      await signup(name, email, password, persona)
      router.replace('/(tabs)/dashboard')
    } catch (e: any) {
      setError(e.message || 'Signup failed')
      setStep(1)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()}>
              <Text style={s.backBtn}>← Back</Text>
            </TouchableOpacity>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { flex: 1, backgroundColor: Colors.accent }]} />
              <View style={[s.progressFill, { flex: 1, backgroundColor: step===2 ? Colors.accent : Colors.borderSubtle }]} />
            </View>
          </View>

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          {/* Step 1 */}
          {step === 1 && (
            <View>
              <Text style={s.title}>Create account</Text>
              <Text style={s.subtitle}>Free to start — no card needed</Text>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Full name</Text>
                <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={Colors.textDisabled} autoFocus />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Email</Text>
                <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.textDisabled} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Password</Text>
                <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Min. 8 characters" placeholderTextColor={Colors.textDisabled} secureTextEntry />
              </View>

              <TouchableOpacity
                style={[s.btn, (!name||!email||password.length<8) && s.btnDisabled]}
                onPress={() => { if(name&&email&&password.length>=8) setStep(2) }}
                disabled={!name||!email||password.length<8}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>Continue →</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/login')} style={s.signInLink}>
                <Text style={s.signInText}>Already have an account? <Text style={s.link}>Sign in</Text></Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 — Persona */}
          {step === 2 && (
            <View>
              <Text style={s.title}>Who are you?</Text>
              <Text style={s.subtitle}>FlowMind personalises your AI assistant to match your lifestyle.</Text>

              <View style={s.personaGrid}>
                {PERSONAS.map(([id, label]) => (
                  <TouchableOpacity
                    key={id}
                    style={[s.personaCard, persona===id && s.personaCardActive]}
                    onPress={() => setPersona(id)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.personaIcon}>{PERSONA_ICONS[id]}</Text>
                    <Text style={[s.personaLabel, persona===id && s.personaLabelActive]}>{label}</Text>
                    <Text style={s.personaDesc} numberOfLines={2}>{PERSONA_DESCRIPTIONS[id]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
                {isLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnText}>Get started 🚀</Text>
                }
              </TouchableOpacity>
              <Text style={s.changeNote}>You can change this anytime in Settings.</Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.bgBase },
  container:         { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
  header:            { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxxl },
  backBtn:           { fontSize: FontSize.sm, color: Colors.textMuted },
  progressBar:       { flex: 1, flexDirection: 'row', gap: 6, height: 4 },
  progressFill:      { borderRadius: 2 },
  errorBox:          { backgroundColor: Colors.coralBg, borderColor: Colors.coral, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:         { fontSize: FontSize.sm, color: Colors.coral },
  title:             { fontFamily: 'DMSans-Medium', fontSize: FontSize.xxl, color: Colors.textPrimary, fontWeight: '800', marginBottom: 6 },
  subtitle:          { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xxxl, lineHeight: 20 },
  fieldGroup:        { marginBottom: Spacing.lg },
  label:             { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  input:             { height: 48, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: Radius.md, paddingHorizontal: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base, backgroundColor: Colors.bgMuted },
  btn:               { height: 52, borderRadius: Radius.md, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  btnDisabled:       { opacity: 0.4 },
  btnText:           { color: '#fff', fontSize: FontSize.base, fontWeight: '600' },
  signInLink:        { marginTop: Spacing.lg, alignItems: 'center' },
  signInText:        { fontSize: FontSize.sm, color: Colors.textMuted },
  link:              { color: Colors.accent, fontWeight: '600' },
  personaGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.xl },
  personaCard:       { width: '47%', backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.borderSubtle, borderRadius: Radius.lg, padding: Spacing.md },
  personaCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentBg },
  personaIcon:       { fontSize: 22, marginBottom: 6 },
  personaLabel:      { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  personaLabelActive:{ color: Colors.accentLight },
  personaDesc:       { fontSize: 11, color: Colors.textMuted, lineHeight: 15 },
  changeNote:        { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
})
