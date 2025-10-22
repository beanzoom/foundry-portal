
export const formatPhoneNumber = (phone: string | null): string => {
  if (!phone) return "Not provided";
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
};

/**
 * Safely formats date values, handling both string and Date objects
 */
export const formatDateSafe = (date: string | Date | undefined): string => {
  if (!date) return "Not set";
  
  try {
    // Convert Date object to ISO string if needed
    const dateString = typeof date === 'string' ? date : date.toISOString();
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Date formatting error:", error, "for date:", date);
    return "Invalid date";
  }
};

/**
 * Format date for display with time - standardized across maintenance components
 */
export const formatDate = (dateString: string) => {
  if (!dateString) return "Not set";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error("Date formatting error:", error, "for date:", dateString);
    return "Invalid date";
  }
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const getRelativeTimeString = (dateString: string): string => {
  if (!dateString) return "Unknown time";
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  } catch (error) {
    console.error("Relative time formatting error:", error, "for date:", dateString);
    return "Unknown time";
  }
};
