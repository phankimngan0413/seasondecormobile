// bookingStatusMapper.js

/**
 * Maps booking status numbers to their string representations
 * @param {number} statusCode - The numeric status code
 * @returns {string} - The string representation of the status
 */
export const mapStatusCodeToString = (statusCode) => {
    const statusMap = {
      0: 'Pending',            // Khi khách hàng tạo booking
      1: 'Planning',           // Provider đã xác nhận và sắp xếp khảo sát
      2: 'Quoting',            // Provider báo giá
      3: 'Contracting',        // Provider soạn hợp đồng
      4: 'Confirm',            // Khi customer đồng ý các điều khoản và chốt hợp đồng
      5: 'DepositPaid',        // Đã thanh toán đặt cọc
      6: 'Preparing',          // Chuẩn bị nguyên liệu
      7: 'InTransit',          // Nguyên liệu được chuyển đến chỗ khách hàng
      8: 'Progressing',        // Đang tiến hành thi công (theo dạng Tracking service)
      9: 'ConstructionPayment',// Thanh toán thi công
      10: 'Completed',         // Dự án hoàn thành
      11: 'PendingCancellation', // Chờ provider duyệt hủy
      12: 'Canceled',          // Booking bị hủy
      13: 'Rejected'           // Booking bị từ chối
    };
    
    return statusMap[statusCode] || 'Unknown';
  };
  
  /**
   * Maps booking status strings to their numeric codes
   * @param {string} statusString - The string status
   * @returns {number} - The numeric status code
   */
  export const mapStatusStringToCode = (statusString) => {
    const reverseStatusMap = {
      'Pending': 0,
      'Planning': 1,
      'Quoting': 2,
      'Contracting': 3,
      'Confirm': 4,
      'DepositPaid': 5,
      'Preparing': 6,
      'InTransit': 7,
      'Progressing': 8,
      'ConstructionPayment': 9,
      'Completed': 10,
      'PendingCancellation': 11,
      'Canceled': 12,
      'Rejected': 13
    };
    
    return reverseStatusMap[statusString] !== undefined ? reverseStatusMap[statusString] : -1;
  };
  
  /**
   * Groups status codes into logical categories
   * @param {number} statusCode - The numeric status code
   * @returns {string} - The category name
   */
  export const getStatusCategory = (statusCode) => {
    const statusString = mapStatusCodeToString(statusCode);
    
    if (['Pending', 'Planning'].includes(statusString)) {
      return 'initial';
    } else if (['Quoting', 'Contracting', 'Confirm'].includes(statusString)) {
      return 'agreement';
    } else if (['DepositPaid', 'Preparing', 'InTransit', 'Progressing', 'ConstructionPayment'].includes(statusString)) {
      return 'construction';
    } else if (statusString === 'Completed') {
      return 'completed';
    } else if (['PendingCancellation', 'Canceled', 'Rejected'].includes(statusString)) {
      return 'cancelled';
    }
    
    return 'unknown';
  };
  
  /**
   * Gets the appropriate color for a booking status
   * @param {number} statusCode - The numeric status code
   * @returns {string} - The color hex code
   */
  export const getStatusColor = (statusCode) => {
    const statusString = mapStatusCodeToString(statusCode);
    
    switch (statusString) {
      case 'Pending':
        return '#ff9500'; // Orange
      case 'Planning':
        return '#007aff'; // Blue
      case 'Quoting':
        return '#5856d6'; // Purple
      case 'Contracting':
        return '#007aff'; // Blue
      case 'Confirm':
        return '#5856d6'; // Purple
      case 'DepositPaid':
        return '#5ac8fa'; // Light blue
      case 'Preparing':
        return '#34c759'; // Green
      case 'InTransit':
        return '#34c759'; // Green
      case 'Progressing':
        return '#34c759'; // Green
      case 'ConstructionPayment':
        return '#5ac8fa'; // Light blue
      case 'Completed':
        return '#4caf50'; // Green
      case 'PendingCancellation':
        return '#ff9500'; // Orange
      case 'Canceled':
        return '#ff3b30'; // Red
      case 'Rejected':
        return '#ff3b30'; // Red
      default:
        return '#8e8e93'; // Gray
    }
  };
  
  /**
   * Gets the appropriate icon name for a booking status
   * @param {number} statusCode - The numeric status code
   * @returns {string} - The Ionicon name
   */
  export const getStatusIcon = (statusCode) => {
    const statusString = mapStatusCodeToString(statusCode);
    
    switch (statusString) {
      case 'Pending':
        return 'time-outline';
      case 'Planning':
        return 'calendar-outline';
      case 'Quoting':
        return 'cash-outline';
      case 'Contracting':
        return 'document-text-outline';
      case 'Confirm':
        return 'checkmark-circle-outline';
      case 'DepositPaid':
        return 'wallet-outline';
      case 'Preparing':
        return 'construct-outline';
      case 'InTransit':
        return 'car-outline';
      case 'Progressing':
        return 'hammer-outline';
      case 'ConstructionPayment':
        return 'cash-outline';
      case 'Completed':
        return 'checkmark-done-circle-outline';
      case 'PendingCancellation':
        return 'hourglass-outline';
      case 'Canceled':
        return 'close-circle-outline';
      case 'Rejected':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };
  
  /**
   * Determines if a booking can be cancelled based on its status
   * @param {number} statusCode - The numeric status code
   * @returns {boolean} - Whether the booking can be cancelled
   */
  export const canBookingBeCancelled = (statusCode) => {
    return [0, 1, 2, 3].includes(statusCode); // Pending, Planning, Quoting, Contracting
  };
  
  /**
   * Determines if a booking needs confirmation
   * @param {number} statusCode - The numeric status code
   * @returns {boolean} - Whether the booking needs confirmation
   */
  export const doesBookingNeedConfirmation = (statusCode) => {
    return statusCode === 3; // Contracting
  };
  
  /**
   * Determines if a booking needs deposit payment
   * @param {number} statusCode - The numeric status code
   * @returns {boolean} - Whether the booking needs deposit
   */
  export const doesBookingNeedDeposit = (statusCode) => {
    return statusCode === 4; // Confirm
  };
  
  /**
   * Gets the stage description for a booking status
   * @param {number} statusCode - The numeric status code
   * @returns {string} - The stage description
   */
  export const getStatusStage = (statusCode) => {
    const statusString = mapStatusCodeToString(statusCode);
    
    if (['Pending', 'Planning'].includes(statusString)) {
      return 'Initial Stage';
    } else if (['Quoting', 'Contracting', 'Confirm'].includes(statusString)) {
      return 'Agreement Stage';
    } else if (['DepositPaid', 'Preparing', 'InTransit'].includes(statusString)) {
      return 'Preparation Stage';
    } else if (['Progressing', 'ConstructionPayment'].includes(statusString)) {
      return 'Construction Stage';
    } else if (statusString === 'Completed') {
      return 'Final Stage';
    } else if (['PendingCancellation', 'Canceled', 'Rejected'].includes(statusString)) {
      return 'Cancelled';
    }
    
    return '';
  };