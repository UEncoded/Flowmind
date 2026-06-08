import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Colors, Spacing, Radius, FontSize } from '../../src/constants/theme'
import { useAuthStore } from '../../src/store/authStore'
import { PERSONA_LABELS, type UserPersona } from '@flowmind/shared'

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

interface Message { id: string; role: 'user'|'assistant'; content: string }

let msgCounter = 0
const uid = () => `m${++msgCounter}`

const QUICK = [
  'Help me prioritise today',
  'Give me a focus strategy',
  'I feel overwhelmed',
  'Plan my week',
]

export default function AIScreen() {
  const { user }          = useAuthStore()
  const [messages, setMsgs] = useState<Message[]>([])
  const [input, setInput]   = useState('')
  const listRef             = useRef<FlatList>(null)
  const qc                  = useQueryClient()
  const persona = (user?.persona || 'other') as UserPersona

  const { data: quota }  = useQuery({ queryKey:['ai-quota'],  queryFn:()=>axios.get(`${API}/api/ai/quota`).then(r=>r.data), refetchInterval:30_000 })
  const { data: streak } = useQuery({ queryKey:['ai-streak'], queryFn:()=>axios.get(`${API}/api/ai/streak`).then(r=>r.data) })

  const chat = useMutation({
    mutationFn: (msg: string) =>
      axios.post(`${API}/api/ai/chat`, {
        message: msg, context:'mobile-ai',
        history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      }).then(r => r.data),
    onMutate: (msg) => {
      setMsgs(p => [...p, { id: uid(), role:'user', content: msg }])
      setInput('')
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    },
    onSuccess: (data) => {
      setMsgs(p => [...p, { id: uid(), role:'assistant', content: data.content }])
      qc.invalidateQueries({ queryKey:['ai-quota']  })
      qc.invalidateQueries({ queryKey:['ai-streak'] })
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    },
  })

  const send = () => { const m=input.trim(); if(m&&!chat.isPending) chat.mutate(m) }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{ flex:1 }} keyboardVerticalOffset={90}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.heading}>AI Assistant ✨</Text>
            <Text style={s.sub}>
              {PERSONA_LABELS[persona]} · {quota?.remaining??10} free req left
              {streak?.streak > 0 ? ` · 🔥 ${streak.streak}d streak` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setMsgs([])} style={s.clearBtn}>
            <Text style={s.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={s.msgList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={{ fontSize:40, marginBottom: Spacing.md }}>✨</Text>
              <Text style={s.emptyTitle}>How can I help?</Text>
              <Text style={s.emptySub}>Personalised for {PERSONA_LABELS[persona]}</Text>
              <View style={s.quickGrid}>
                {QUICK.map(q => (
                  <TouchableOpacity key={q} style={s.quickBtn} onPress={()=>chat.mutate(q)} activeOpacity={0.7}>
                    <Text style={s.quickBtnText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.msgRow, item.role==='user' && s.msgRowUser]}>
              <View style={[s.msgBubble, item.role==='user' ? s.msgBubbleUser : s.msgBubbleAI]}>
                <Text style={[s.msgText, item.role==='user' && s.msgTextUser]}>{item.content}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            chat.isPending ? (
              <View style={s.msgRow}>
                <View style={s.msgBubbleAI}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={s.inputArea}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything…"
            placeholderTextColor={Colors.textDisabled}
            multiline
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim()||chat.isPending) && { opacity:0.4 }]}
            onPress={send}
            disabled={!input.trim()||chat.isPending}
            activeOpacity={0.85}
          >
            <Text style={{ color:'#fff', fontSize:16 }}>→</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor: Colors.bgBase },
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth:1, borderBottomColor: Colors.borderFaint },
  heading:       { fontSize: FontSize.lg, fontWeight:'800', color: Colors.textPrimary, marginBottom:2 },
  sub:           { fontSize: FontSize.xs, color: Colors.textMuted },
  clearBtn:      { paddingHorizontal: Spacing.md, height:30, borderRadius: Radius.pill, borderWidth:1, borderColor: Colors.borderSubtle, alignItems:'center', justifyContent:'center' },
  clearBtnText:  { fontSize: FontSize.xs, color: Colors.textMuted },
  msgList:       { padding: Spacing.xl, flexGrow:1 },
  emptyState:    { alignItems:'center', paddingTop: Spacing.xxxl },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight:'700', color: Colors.textPrimary, marginBottom:4 },
  emptySub:      { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  quickGrid:     { gap:8, width:'100%' },
  quickBtn:      { backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md, borderWidth:1, borderColor: Colors.borderSubtle },
  quickBtnText:  { fontSize: FontSize.sm, color: Colors.textSecondary },
  msgRow:        { marginBottom: Spacing.md },
  msgRowUser:    { alignItems:'flex-end' },
  msgBubble:     { maxWidth:'85%', borderRadius: Radius.lg, padding: Spacing.md },
  msgBubbleUser: { backgroundColor: Colors.accent, borderBottomRightRadius: Radius.sm },
  msgBubbleAI:   { backgroundColor: Colors.bgCard, borderWidth:1, borderColor: Colors.borderFaint, borderBottomLeftRadius: Radius.sm },
  msgText:       { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight:20 },
  msgTextUser:   { color:'#fff' },
  inputArea:     { flexDirection:'row', alignItems:'flex-end', gap: Spacing.sm, padding: Spacing.md, paddingBottom: Spacing.lg, borderTopWidth:1, borderTopColor: Colors.borderFaint, backgroundColor: Colors.bgBase },
  input:         { flex:1, backgroundColor: Colors.bgMuted, borderWidth:1, borderColor: Colors.borderSubtle, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.sm, maxHeight:100 },
  sendBtn:       { width:44, height:44, borderRadius: Radius.md, backgroundColor: Colors.accent, alignItems:'center', justifyContent:'center' },
})
