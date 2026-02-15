export const getDateCategory = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // Reset hours to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (checkDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (checkDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else if (checkDate > sevenDaysAgo) {
    return 'Previous 7 Days';
  } else if (checkDate > thirtyDaysAgo) {
    return 'Previous 30 Days';
  } else {
    return 'Older';
  }
};

export const groupChatsByDate = (chats: any[]) => {
  const groups: { [key: string]: any[] } = {};
  
  // Sort by newest first
  const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  sortedChats.forEach(chat => {
    const category = getDateCategory(chat.updatedAt);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(chat);
  });

  return groups;
};