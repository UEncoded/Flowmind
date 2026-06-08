import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../src/constants/theme'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[ts.iconWrap, focused && ts.iconActive]}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={[ts.label, focused && ts.labelActive]}>{label}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgSubtle,
          borderTopColor: Colors.borderFaint,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 8,
          height: 64,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home"    focused={focused} /> }}
      />
      <Tabs.Screen
        name="tasks"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✅" label="Tasks"   focused={focused} /> }}
      />
      <Tabs.Screen
        name="focus"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⏱️" label="Focus"   focused={focused} /> }}
      />
      <Tabs.Screen
        name="ai"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✨" label="AI"      focused={focused} /> }}
      />
      <Tabs.Screen
        name="habits"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔥" label="Habits"  focused={focused} /> }}
      />
    </Tabs>
  )
}

const ts = StyleSheet.create({
  iconWrap:    { alignItems: 'center', gap: 2, paddingTop: 2, opacity: 0.5 },
  iconActive:  { opacity: 1 },
  label:       { fontSize: 10, color: Colors.textMuted },
  labelActive: { color: Colors.accent, fontWeight: '600' },
})
