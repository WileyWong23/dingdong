// 叮咚 DingDong - Push Notification Service

import { subscribeApi } from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// URL Base64 转 Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 检查浏览器是否支持通知
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

// 获取当前通知权限状态
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// 请求通知权限
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

// 注册 Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw-custom.js');
    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// 订阅推送
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key not configured');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // 检查是否已有订阅
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // 创建新订阅
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }
    
    // 发送到后端
    await subscribeApi.save(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

// 取消推送订阅
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // 从后端删除
      await subscribeApi.delete(subscription.endpoint);
      // 取消本地订阅
      await subscription.unsubscribe();
    }
    
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

// 检查是否已订阅
export async function isSubscribed(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// 初始化推送（请求权限 + 注册 SW + 订阅）
export async function initializePush(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }
  
  // 如果已订阅则跳过
  if (await isSubscribed()) {
    return true;
  }
  
  // 请求权限
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return false;
  }
  
  // 注册 Service Worker
  const registration = await registerServiceWorker();
  if (!registration) {
    return false;
  }
  
  // 订阅推送
  const subscription = await subscribeToPush();
  return subscription !== null;
}

// 显示本地通知（离线时使用）
export function showLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
  if (getNotificationPermission() !== 'granted') {
    return;
  }
  
  navigator.serviceWorker.ready.then(registration => {
    registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data,
      requireInteraction: true,
      tag: 'dingdong-reminder',
    });
  });
}
