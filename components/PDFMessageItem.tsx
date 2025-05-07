// PDFMessageItem.tsx - Create this as a separate component file
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import RNFS from 'react-native-fs';
import { Linking } from 'react-native';
// Import PDF component safely
const PDFView = require('react-native-pdf');

// Props interface for the component
interface PDFMessageItemProps {
  fileUrl: string;
  fileName: string;
  colors?: {
    primary?: string;
    text?: string;
    border?: string;
  };
}

// Create a separate component for PDF
const PDFMessageItem: React.FC<PDFMessageItemProps> = ({ fileUrl, fileName, colors = {} }) => {
  const [pdfDownloading, setPdfDownloading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  
  // Function to open PDF file
  const openPDFFile = async (fileUri: string): Promise<void> => {
    if (Platform.OS === 'ios') {
      // On iOS, use QuickLook to preview the PDF
      await Linking.openURL(fileUri);
    } else {
      // On Android, try to share the file
      try {
        // Android - copy to downloads folder for easy access
        const destFileName = fileUri.substring(fileUri.lastIndexOf('/') + 1);
        const destPath = `${RNFS.DownloadDirectoryPath}/${destFileName}`;
        await RNFS.copyFile(fileUri, destPath);
        Alert.alert('File Saved', `File saved to Downloads folder as ${destFileName}`);
        
        // Try to open the file
        await Linking.openURL(`file://${destPath}`);
      } catch (error) {
        console.error('Error handling file:', error);
        // Fallback to direct opening
        await Linking.openURL(fileUri);
      }
    }
  };

  // Handle PDF file
  const handlePDFFile = async (): Promise<void> => {
    try {
      // Show loading indicator
      setPdfDownloading(true);
      
      // Create file directory if needed
      const directory = FileSystem.documentDirectory + 'Downloads/';
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }
      
      // Generate local file path
      const localFilePath = directory + fileName;
      const fileInfo = await FileSystem.getInfoAsync(localFilePath);
      
      // If file already exists, open it directly
      if (fileInfo.exists) {
        console.log('File already exists locally, opening...');
        await openPDFFile(localFilePath);
        setPdfDownloading(false);
        return;
      }
      
      // Download the file
      console.log(`Downloading file from ${fileUrl} to ${localFilePath}`);
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        localFilePath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${progress * 100}%`);
        }
      );
      
      const result = await downloadResumable.downloadAsync();
      console.log('Download complete:', result);
      
      if (result && result.uri) {
        await openPDFFile(result.uri);
      } else {
        Alert.alert('Error', 'Failed to download the file');
      }
    } catch (error) {
      console.error('Error handling PDF file:', error);
      Alert.alert('Error', 'Failed to download or open the file');
      
      // Fallback to opening in browser
      try {
        await Linking.openURL(fileUrl);
      } catch (linkError) {
        console.error('Could not open URL:', linkError);
      }
    } finally {
      setPdfDownloading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <Ionicons name="document-text" size={24} color="#E44D26" />
        <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.button, styles.downloadButton]}
          onPress={handlePDFFile}
          disabled={pdfDownloading}
        >
          {pdfDownloading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="download" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Download</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.viewButton]}
          onPress={() => setPreviewVisible(true)}
        >
          <Ionicons name="eye" size={16} color="#FFFFFF" />
          <Text style={styles.buttonText}>View</Text>
        </TouchableOpacity>
      </View>
      
      {/* PDF Preview Modal */}
      <Modal visible={previewVisible} transparent={false} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{fileName}</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setPreviewVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pdfContainer}>
            {PDFView && (
              <PDFView
                source={{ uri: fileUrl }}
                style={styles.pdfView}
                onLoadComplete={(numberOfPages: number) => {
                  console.log(`PDF loaded with ${numberOfPages} pages`);
                }}
                onError={(error: any) => {
                  console.error('PDF loading error:', error);
                  Alert.alert('Error', 'Failed to load PDF');
                  setPreviewVisible(false);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Separate styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  downloadButton: {
    backgroundColor: '#4285F4',
  },
  viewButton: {
    backgroundColor: '#34A853',
    marginRight: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  pdfView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default PDFMessageItem;