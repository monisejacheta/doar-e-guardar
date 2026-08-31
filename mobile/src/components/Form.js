import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../screens/Styles';

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={label}
        accessibilityHint={placeholder}
        style={{
          minHeight: 56,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          color: colors.text,
          fontSize: 17
        }}
      />
    </View>
  );
}

export function SelectBox({ label, value, options, onPress }) {
  const selected = options.find((item) => item.id === value);
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '700' }}>{label}</Text>
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.name || selected?.code || 'Nao selecionado' }}
        accessibilityHint="Toque para escolher uma opcao"
        style={{
          minHeight: 56,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Text style={{ color: selected ? colors.text : colors.placeholder, flex: 1, fontSize: 17 }}>
          {selected?.name || selected?.code || 'Selecione'}
        </Text>
        <Ionicons name="chevron-down" size={22} color={colors.icon} />
      </TouchableOpacity>
    </View>
  );
}

export function ActionButton({ label, icon, onPress, variant = 'primary', disabled = false }) {
  const backgroundColor = variant === 'primary' ? colors.primary : colors.brandBlueSoft;
  const color = variant === 'primary' ? colors.primaryText : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{
        minHeight: 56,
        borderRadius: 8,
        backgroundColor: disabled ? colors.disabled : backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg
      }}
    >
      {icon ? <Ionicons name={icon} size={22} color={color} /> : null}
      <Text style={{ color, fontSize: 17, lineHeight: 22, fontWeight: '800' }}>{label}</Text>
    </TouchableOpacity>
  );
}
