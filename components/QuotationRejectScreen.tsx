import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/ThemeContext';
import { Colors } from '@/constants/Colors';
import { 
  requestToChangeQuotationAPI, 
  requestToCancelQuotationAPI,
  getCancelTypesAPI,
  ICancelType 
} from '@/utils/quotationsAPI';

const PRIMARY_COLOR = "#5fc1f1";
const CHANGE_COLOR = "#4f46e5"; // Indigo for change requests
const CANCEL_COLOR = "#ef4444"; // Red for cancel
const WARNING_COLOR = "#ff9500";

// Types for action selection
type ActionType = 'change' | 'cancel';

interface QuotationRejectScreenProps {
  visible: boolean;
  onClose: () => void;
  quotationCode: string;
  onSuccess?: () => void;
}

type IoniconsName = 
  | "close"
  | "arrow-back"
  | "checkmark-circle-outline"
  | "alert-circle-outline"
  | "time-outline"
  | "document-text-outline"
  | "radio-button-on"
  | "radio-button-off"
  | "information-circle-outline"
  | "create-outline"
  | "close-circle-outline";

const QuotationRejectScreen: React.FC<QuotationRejectScreenProps> = ({
  visible,
  onClose,
  quotationCode,
  onSuccess
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme as "light" | "dark"];

  // States
  const [selectedAction, setSelectedAction] = useState<ActionType>('change');
  const [selectedCancelType, setSelectedCancelType] = useState<number | null>(null);
  const [additionalComments, setAdditionalComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cancelTypes, setCancelTypes] = useState<ICancelType[]>([]);
  const [loadingCancelTypes, setLoadingCancelTypes] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    cancelType?: string;
    comments?: string;
  }>({});

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedAction('change');
      setSelectedCancelType(null);
      setAdditionalComments('');
      setErrors({});
      fetchCancelTypes();
    }
  }, [visible]);

  const fetchCancelTypes = async () => {
    try {
      setLoadingCancelTypes(true);
      const types = await getCancelTypesAPI();
      setCancelTypes(types);
    } catch (error) {
      console.error('Error fetching cancel types:', error);
      setCancelTypes([]);
    } finally {
      setLoadingCancelTypes(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { cancelType?: string; comments?: string } = {};

    // Check comments for all actions
    if (!additionalComments.trim()) {
      if (selectedAction === 'change') {
        newErrors.comments = "Please provide details about what you'd like changed";
      } else {
        newErrors.comments = "Please provide a reason for cancellation";
      }
    }

    // For cancel action, check cancel type
    if (selectedAction === 'cancel' && !selectedCancelType) {
      newErrors.cancelType = "Please select a cancellation reason";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActionSelect = (action: ActionType) => {
    setSelectedAction(action);
    setSelectedCancelType(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (selectedAction === 'change') {
        // Submit change request
        const result = await requestToChangeQuotationAPI(quotationCode, additionalComments.trim());
        
        if (result.success) {
          Alert.alert(
            'Success',
            'Your change request has been submitted. The provider will review and update the quotation.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onClose();
                  if (onSuccess) onSuccess();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to submit change request');
        }
      } else {
        // Submit cancel request
        if (!selectedCancelType) return;
        
        const result = await requestToCancelQuotationAPI(
          quotationCode, 
          selectedCancelType, 
          additionalComments.trim()
        );
        
        if (result.success) {
          Alert.alert(
            'Success',
            'Your cancellation request has been submitted and will be reviewed.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onClose();
                  if (onSuccess) onSuccess();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.message || 'Failed to submit cancellation request');
        }
      }
    } catch (error: any) {
      console.error('Error submitting:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentColor = () => {
    switch (selectedAction) {
      case 'change': return CHANGE_COLOR;
      case 'cancel': return CANCEL_COLOR;
      default: return PRIMARY_COLOR;
    }
  };

  const renderHeader = (): React.ReactElement => (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        disabled={isSubmitting}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Request Changes
      </Text>
      <View style={styles.spacer} />
    </View>
  );

  const renderActionSelector = (): React.ReactElement => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        What would you like to do?
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Choose the action that best describes what you want to do with this quotation.
      </Text>

      <View style={styles.actionsList}>
        {/* Change Request Option */}
        <TouchableOpacity
          style={[
            styles.actionOption,
            {
              backgroundColor: selectedAction === 'change' ? `${CHANGE_COLOR}15` : colors.background,
              borderColor: selectedAction === 'change' ? CHANGE_COLOR : colors.border,
            }
          ]}
          onPress={() => handleActionSelect('change')}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <View style={styles.actionContent}>
            <Ionicons
              name="create-outline"
              size={20}
              color={selectedAction === 'change' ? CHANGE_COLOR : colors.textSecondary}
            />
            <View style={styles.actionTextContainer}>
              <Text style={[
                styles.actionTitle,
                { color: selectedAction === 'change' ? CHANGE_COLOR : colors.text }
              ]}>
                Request Changes
              </Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Ask the provider to modify price, materials, or timeline
              </Text>
            </View>
            <Ionicons
              name={selectedAction === 'change' ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={selectedAction === 'change' ? CHANGE_COLOR : colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Cancel Request Option */}
        <TouchableOpacity
          style={[
            styles.actionOption,
            {
              backgroundColor: selectedAction === 'cancel' ? `${CANCEL_COLOR}15` : colors.background,
              borderColor: selectedAction === 'cancel' ? CANCEL_COLOR : colors.border,
            }
          ]}
          onPress={() => handleActionSelect('cancel')}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <View style={styles.actionContent}>
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={selectedAction === 'cancel' ? CANCEL_COLOR : colors.textSecondary}
            />
            <View style={styles.actionTextContainer}>
              <Text style={[
                styles.actionTitle,
                { color: selectedAction === 'cancel' ? CANCEL_COLOR : colors.text }
              ]}>
                Cancel Quotation
              </Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Request to cancel the entire quotation
              </Text>
            </View>
            <Ionicons
              name={selectedAction === 'cancel' ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={selectedAction === 'cancel' ? CANCEL_COLOR : colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCancelTypeSelector = (): React.ReactElement => {
    if (selectedAction !== 'cancel') return <></>;

    return (
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Select cancellation reason:
        </Text>

        {loadingCancelTypes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={CANCEL_COLOR} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading cancellation types...
            </Text>
          </View>
        ) : cancelTypes.length > 0 ? (
          <View style={styles.cancelTypesList}>
            {cancelTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.cancelTypeOption,
                  {
                    backgroundColor: selectedCancelType === type.id ? `${CANCEL_COLOR}15` : colors.background,
                    borderColor: selectedCancelType === type.id ? CANCEL_COLOR : colors.border,
                  }
                ]}
                onPress={() => {
                  setSelectedCancelType(type.id);
                  setErrors((prev) => ({ ...prev, cancelType: undefined }));
                }}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={selectedCancelType === type.id ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={selectedCancelType === type.id ? CANCEL_COLOR : colors.textSecondary}
                />
                <Text style={[
                  styles.cancelTypeText,
                  { color: selectedCancelType === type.id ? CANCEL_COLOR : colors.text }
                ]}>
                  {type.type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={[styles.noCancelTypesText, { color: colors.textSecondary }]}>
            No cancellation types available
          </Text>
        )}

        {errors.cancelType && (
          <Text style={[styles.errorText, { color: CANCEL_COLOR }]}>
            {errors.cancelType}
          </Text>
        )}
      </View>
    );
  };

  const renderCommentsSection = (): React.ReactElement => {
    const currentColor = getCurrentColor();
    
    return (
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {selectedAction === 'change' ? 'What would you like changed?' : 'Additional Details'}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {selectedAction === 'change' 
            ? "Please describe what specific changes you'd like to see in the quotation."
            : "Please provide more details about your decision."
          }
        </Text>

        <TextInput
          style={[
            styles.textAreaInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: errors.comments ? currentColor : colors.border,
            }
          ]}
          value={additionalComments}
          onChangeText={(text) => {
            setAdditionalComments(text);
            if (errors.comments) {
              setErrors((prev) => ({ ...prev, comments: undefined }));
            }
          }}
          placeholder={
            selectedAction === 'change' 
              ? "Describe what you'd like changed (price, materials, timeline, etc.)..."
              : "Please explain why you want to cancel..."
          }
          placeholderTextColor={colors.textSecondary}
          multiline={true}
          numberOfLines={selectedAction === 'change' ? 6 : 4}
          textAlignVertical="top"
          maxLength={1000}
        />

        {errors.comments && (
          <Text style={[styles.errorText, { color: currentColor }]}>
            {errors.comments}
          </Text>
        )}

        <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
          {additionalComments.length}/1000 characters
        </Text>
      </View>
    );
  };

  const renderWhatHappensNext = (): React.ReactElement => {
    const currentColor = getCurrentColor();
    
    return (
      <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          What happens next?
        </Text>
        
        <View style={styles.stepsList}>
          {selectedAction === 'change' ? (
            <>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${currentColor}20` }]}>
                  <Text style={[styles.stepNumberText, { color: currentColor }]}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                  Your change request will be sent to the provider
                </Text>
              </View>
              
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${currentColor}20` }]}>
                  <Text style={[styles.stepNumberText, { color: currentColor }]}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                  The provider will review and revise the quotation
                </Text>
              </View>
              
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${currentColor}20` }]}>
                  <Text style={[styles.stepNumberText, { color: currentColor }]}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                  You'll receive a notification when ready for review
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${currentColor}20` }]}>
                  <Text style={[styles.stepNumberText, { color: currentColor }]}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                  Your cancellation request will be reviewed
                </Text>
              </View>
              
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${currentColor}20` }]}>
                  <Text style={[styles.stepNumberText, { color: currentColor }]}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                  You'll receive confirmation once processed
                </Text>
              </View>
              
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${currentColor}20` }]}>
                  <Text style={[styles.stepNumberText, { color: currentColor }]}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                  Any deposits may be subject to refund policy
                </Text>
              </View>
            </>
          )}
        </View>
        
        <View style={[styles.helpContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Need help? Contact our support team at support@example.com
          </Text>
        </View>
      </View>
    );
  };

  const getActionButtonText = () => {
    switch (selectedAction) {
      case 'change': return 'Submit Change Request';
      case 'cancel': return 'Submit Cancellation';
      default: return 'Submit';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        
        {renderHeader()}
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quotation Info */}
            <View style={[styles.quotationInfo, { backgroundColor: `${WARNING_COLOR}15` }]}>
              <Ionicons name="alert-circle-outline" size={24} color={WARNING_COLOR} />
              <View style={styles.quotationInfoText}>
                <Text style={[styles.quotationCode, { color: colors.text }]}>
                  Quotation #{quotationCode}
                </Text>
                <Text style={[styles.quotationWarning, { color: colors.textSecondary }]}>
                  Choose what you'd like to do with this quotation.
                </Text>
              </View>
            </View>

            {/* Action Selector */}
            {renderActionSelector()}

            {/* Cancel Type Selector (only for cancel action) */}
            {renderCancelTypeSelector()}

            {/* Comments Section */}
            {renderCommentsSection()}

            {/* What Happens Next */}
            {renderWhatHappensNext()}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={onClose}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: isSubmitting ? `${getCurrentColor()}60` : getCurrentColor(),
                  }
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{getActionButtonText()}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpace} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  scrollContent: {
    padding: 15,
  },
  quotationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  quotationInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  quotationCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quotationWarning: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  actionsList: {
    marginTop: 10,
  },
  actionOption: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  cancelTypesList: {
    marginTop: 10,
  },
  cancelTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  cancelTypeText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  noCancelTypesText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 15,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  infoSection: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  stepsList: {
    marginBottom: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 6,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});

export default QuotationRejectScreen;