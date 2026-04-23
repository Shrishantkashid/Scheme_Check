import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { ONBOARDING_QUESTIONS, INITIAL_QUESTION_ID, Question } from '@/constants/questions';
import { API_URL } from '@/constants/config';
import { useAuth } from '@/context/auth';

interface QuestionEngineProps {
  onComplete: () => void;
  mode: 'manual' | 'voice';
  voiceTrigger?: { value: string; timestamp: number } | null;
  onQuestionChange?: (id: string) => void;
}

export function QuestionEngine({ onComplete, mode, voiceTrigger, onQuestionChange }: QuestionEngineProps) {
  const { user, token, updateUser } = useAuth();
  const [currentId, setCurrentId] = useState<string>(user?.lastQuestionId || INITIAL_QUESTION_ID);
  const [answers, setAnswers] = useState<Record<string, any>>(user?.profile || {});
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const currentQuestion = ONBOARDING_QUESTIONS[currentId];

  useEffect(() => {
    // Notify parent if question ID changes (important for voice mode sync)
    onQuestionChange?.(currentId);
    
    // If we're resuming, we might have an answer already for the "current" question
    if (answers[currentId] !== undefined) {
      setInputValue(String(answers[currentId]));
    } else {
      setInputValue('');
    }
  }, [currentId]);

  // Handle external voice trigger
  useEffect(() => {
    if (mode === 'voice' && voiceTrigger && voiceTrigger.value) {
      if (currentQuestion.type === 'choice') {
        const option = currentQuestion.options?.find(o => o.value === voiceTrigger.value);
        if (option) {
          handleChoice(option.value, option.next);
        }
      } else if (currentQuestion.type === 'number' || currentQuestion.type === 'text') {
        saveAnswer(voiceTrigger.value, currentQuestion.next);
      }
    }
  }, [voiceTrigger?.timestamp]);

  const saveAnswer = async (value: any, nextId?: string | null) => {
    setIsSaving(true);
    try {
      const isFinal = !nextId || ONBOARDING_QUESTIONS[currentId]?.isFinal;
      
      const res = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile: { [currentId]: value },
          lastQuestionId: isFinal ? null : nextId,
          isOnboarded: isFinal ? true : undefined
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save progress');
      }

      // Update local auth context
      updateUser({
        profile: { ...answers, [currentId]: value },
        lastQuestionId: isFinal ? null : (nextId || null),
        isOnboarded: isFinal ? true : user?.isOnboarded
      });

      setAnswers(prev => ({ ...prev, [currentId]: value }));

      if (isFinal) {
        onComplete();
      } else if (nextId) {
        setHistory(prev => [...prev, currentId]);
        setCurrentId(nextId);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      Alert.alert('Error', 'Failed to save your progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChoice = (value: string, nextId?: string) => {
    saveAnswer(value, nextId);
  };

  const handleNext = () => {
    if (!inputValue) return;
    const nextId = currentQuestion.next;
    saveAnswer(inputValue, nextId);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevHistory = [...history];
      const prevId = prevHistory.pop();
      setHistory(prevHistory);
      if (prevId) setCurrentId(prevId);
    }
  };

  if (!currentQuestion) return null;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(history.length / Object.keys(ONBOARDING_QUESTIONS).length) * 100}%` }]} />
      </View>

      <Animated.View 
        key={currentId}
        entering={FadeInRight.duration(400)}
        exiting={FadeOutLeft.duration(400)}
        layout={Layout.springify()}
        style={styles.questionCard}
      >
        <ThemedText style={styles.questionText}>
          {mode === 'voice' ? currentQuestion.kannadaText : currentQuestion.text}
        </ThemedText>

        <View style={styles.inputSection}>
          {currentQuestion.type === 'choice' && currentQuestion.options?.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                answers[currentId] === option.value && styles.selectedOption
              ]}
              onPress={() => handleChoice(option.value, option.next)}
              disabled={isSaving}
            >
              <ThemedText style={styles.optionText}>{option.label}</ThemedText>
              {answers[currentId] === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.premium.primary} />
              )}
            </TouchableOpacity>
          ))}

          {(currentQuestion.type === 'number' || currentQuestion.type === 'text') && (
            <View style={styles.textInputWrapper}>
              <BlurView intensity={20} tint="light" style={styles.textInputBlur}>
                <TextInput
                  style={styles.textInput}
                  placeholder={currentQuestion.type === 'number' ? 'Enter number' : 'Type here...'}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType={currentQuestion.type === 'number' ? 'numeric' : 'default'}
                  value={inputValue}
                  onChangeText={setInputValue}
                  autoFocus
                />
              </BlurView>
              <TouchableOpacity 
                style={[styles.nextButton, !inputValue && styles.disabledButton]} 
                onPress={handleNext}
                disabled={!inputValue || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Ionicons name="arrow-forward" size={24} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleBack} 
          disabled={history.length === 0 || isSaving}
          style={[styles.backButton, history.length === 0 && { opacity: 0 }]}
        >
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.6)" />
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </TouchableOpacity>
        
        {isSaving && currentQuestion.type === 'choice' && (
          <ActivityIndicator color={Colors.premium.primary} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.premium.primary,
  },
  questionCard: {
    flex: 1,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 32,
    lineHeight: 34,
  },
  inputSection: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedOption: {
    borderColor: Colors.premium.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInputBlur: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.premium.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.premium.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
});
