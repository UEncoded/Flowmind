import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { Link, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Radius, FontSize } from '../src/constants/theme'
import { useAuthStore } from '../src/store/authStore'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const { login, isLoading }    = useAuthStore()

  const handleLogin = async () => {
    setError('')
    try {
      await login(email, password)
      router.replace('/(tabs)/dashboard')
    } catch (e: any) {
      setError(e.message || 'Login failed')
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoRow}>
            <View style={s.logoBox}>
              <Text style={{ fontSize: 16 }}>⚡</Text>
            </View>
            <Text style={s.logoText}>FlowMind</Text>
          </View>

          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your workspace</Text>

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          {/* Email */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, isLoading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.btnText}>Sign in →</Text>
            }
          </TouchableOpacity>

          {/* Demo */}
          <TouchableOpacity
            style={s.demoBtn}
            onPress={() => { setEmail('demo@flowmind.app'); setPassword('demo1234') }}
          >
            <Text style={s.demoBtnText}>Use demo account</Text>
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text style={s.link}>Sign up free</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bgBase },
  container:   { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl, paddingBottom: Spacing.xxxl },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xxxl },
  logoBox:     { width: 32, height: 32, borderRadius: Radius.md, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  logoText:    { fontFamily: 'DMSans-Medium', fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700' },
  title:       { fontFamily: 'DMSans-Medium', fontSize: FontSize.xxl, color: Colors.textPrimary, fontWeight: '800', marginBottom: 6 },
  subtitle:    { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xxxl },
  errorBox:    { backgroundColor: Colors.coralBg, borderColor: Colors.coral, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:   { fontSize: FontSize.sm, color: Colors.coral },
  fieldGroup:  { marginBottom: Spacing.lg },
  label:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: 'DMSans-Medium', marginBottom: 6 },
  input:       { height: 48, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: Radius.md, paddingHorizontal: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base, backgroundColor: Colors.bgMuted },
  btn:         { height: 52, borderRadius: Radius.md, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: FontSize.base, fontFamily: 'DMSans-Medium', fontWeight: '600' },
  demoBtn:     { height: 48, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  demoBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footer:      { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText:  { fontSize: FontSize.sm, color: Colors.textMuted },
  link:        { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600' },
})
