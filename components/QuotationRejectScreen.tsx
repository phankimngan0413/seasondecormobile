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
} from '@/utils/quotationsAPI';
import {
  getAllCancelTypesAPI,
  ICancelType 
} from '@/utils/bookingAPI';

const PRIMARY_COLOR = "#5fc1f1";
const CHANGE_COLOR = "#4f46e5"; // Indigo for change requests
const CANCEL_COLOR = "#ef4444"; // Red for cancel
const WARNING_COLOR = "#ff9500";

// Function to clean HTML content and extract plain text
const cleanHtmlContent = (htmlString: string): string => {
  if (!htmlString) return '';
  
  // Remove HTML tags and decode HTML entities
  let cleanText = htmlString
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/&apos;/g, "'") // Replace &apos; with '
    .trim(); // Remove leading/trailing whitespace
  
  return cleanText;
};

// Check if content contains HTML tags
const containsHtml = (content: string): boolean => {
  if (!content) return false;
  return /<[^>]*>/g.test(content);
};

// Function to safely process text content
const processTextContent = (text: string | undefined): string => {
  if (!text) return '';
  
  // If contains HTML, clean it
  if (containsHtml(text)) {
    return cleanHtmlContent(text);
  }
  
  return text.trim();
};

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
      const response = await getAllCancelTypesAPI();
      
      // Handle different response formats
      let types: ICancelType[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        types = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        // Response with data wrapper
        types = response.data;
      } else {
        types = [];
      }
      
      // Clean HTML content from cancel types
      const cleanedTypes = types.map(cancelType => ({
        ...cancelType,
        type: processTextContent(cancelType.type),
        name: cancelType.name ? processTextContent(cancelType.name) : undefined,
        description: cancelType.description ? processTextContent(cancelType.description) : undefined
      }));
      
      setCancelTypes(cleanedTypes);
    } catch (error) {
      setCancelTypes([]);
    } finally {
      setLoadingCancelTypes(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { cancelType?: string; comments?: string } = {};

    // Clean and validate comments
    const cleanedComments = processTextContent(additionalComments);
    
    if (!cleanedComments) {
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

  // Helper function to check if API response indicates success
  const isApiResponseSuccessful = (result: any): boolean => {
    // If result is null or undefined, it's not successful
    if (!result) {
      return false;
    }
    
    // If result is a boolean true, it's successful
    if (result === true) {
      return true;
    }
    
    // If result is an object, check for success indicators
    if (typeof result === 'object') {
      // Check for explicit success property
      if ('success' in result && result.success === true) {
        return true;
      }
      
      // Check for HTTP status codes indicating success
      if ('status' in result && typeof result.status === 'number' && result.status >= 200 && result.status < 300) {
        return true;
      }
      
      // Check for common success indicators in message
      if ('message' in result && typeof result.message === 'string') {
        const messageText = result.message.toLowerCase();
        if (messageText.includes('success') || 
            messageText.includes('submitted') || 
            messageText.includes('completed') ||
            messageText.includes('awaiting') ||
            messageText.includes('approved')) {
          return true;
        }
      }
      
      // Check for errors property being empty/null
      if ('errors' in result && (result.errors === null || (Array.isArray(result.errors) && result.errors.length === 0))) {
        return true;
      }
      
      // If no explicit success/error indicators and it's an object, assume success
      if (!('success' in result) && !('error' in result) && !('message' in result)) {
        return true;
      }
      
      return false;
    }
    
    return false;
  };

  // Helper function to extract message from API response
  const getMessageFromResponse = (result: any, defaultMessage: string): string => {
    if (result && typeof result === 'object' && 'message' in result && typeof result.message === 'string') {
      return result.message;
    }
    return defaultMessage;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Clean the comments before submitting
      const cleanedComments = processTextContent(additionalComments);

      if (selectedAction === 'change') {
        // Submit change request
        const result = await requestToChangeQuotationAPI(quotationCode, cleanedComments);
        
        if (isApiResponseSuccessful(result)) {
          const successMessage = getMessageFromResponse(
            result, 
            'Your change request has been submitted. The provider will review and update the quotation.'
          );
            
          Alert.alert(
            'Success',
            successMessage,
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
          const errorMessage = getMessageFromResponse(result, 'Failed to submit change request');
          Alert.alert('Error', errorMessage);
        }
      } else {
        // Submit cancel request
        if (!selectedCancelType) return;
        
        const result = await requestToCancelQuotationAPI(
          quotationCode, 
          selectedCancelType,  // This is now quotationCancelId 
          cleanedComments
        );
        
        if (isApiResponseSuccessful(result)) {
          const successMessage = getMessageFromResponse(
            result,
            'Your cancellation request has been submitted and will be reviewed.'
          );
            
          Alert.alert(
            'Success',
            successMessage,
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
          const errorMessage = getMessageFromResponse(result, 'Failed to submit cancellation request');
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error: any) {
      // Even if there's an error, if the request was sent successfully, show success
      // This handles cases where API returns 200 but throws due to response format
      if (error.response && error.response.status && 
          typeof error.response.status === 'number' && 
          error.response.status >= 200 && error.response.status < 300) {
        Alert.alert(
          'Success',
          selectedAction === 'change' 
            ? 'Your change request has been submitted successfully.'
            : 'Your cancellation request has been submitted successfully.',
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
        Alert.alert(
          'Error',
          error.message || 'An error occurred. Please try again.'
        );
      }
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
            {cancelTypes.map((cancelType) => (
              <TouchableOpacity
                key={cancelType.id}
                style={[
                  styles.cancelTypeOption,
                  {
                    backgroundColor: selectedCancelType === cancelType.id ? `${CANCEL_COLOR}15` : colors.background,
                    borderColor: selectedCancelType === cancelType.id ? CANCEL_COLOR : colors.border,
                  }
                ]}
                onPress={() => {
                  setSelectedCancelType(cancelType.id);
                  setErrors((prev) => ({ ...prev, cancelType: undefined }));
                }}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={selectedCancelType === cancelType.id ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={selectedCancelType === cancelType.id ? CANCEL_COLOR : colors.textSecondary}
                />
                <Text style={[
                  styles.cancelTypeText,
                  { color: selectedCancelType === cancelType.id ? CANCEL_COLOR : colors.text }
                ]}>
                  {cancelType.type}
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
            // Prevent HTML input
            if (containsHtml(text)) {
              Alert.alert("Invalid Input", "HTML content is not allowed. Please enter plain text only.");
              return;
            }
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