import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, User, MapPin, Phone, Mail, Calendar, 
  DollarSign, Eye, Edit, Trash2, MessageSquare, FileText, CheckCircle, Truck,
  Paperclip, Download, X, Upload, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL, API_BASE_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { OrderManagementVisual } from '@/app/components/admin/OrderManagementVisual';
import { generateInvoicePDF } from '@/app/utils/generateInvoicePDF';

const ORDERS_STORAGE_KEY = 'honey_translation_orders';
// Was reading VITE_BACKEND_URL (never set) with a localhost:3000 fallback —
// this silently broke "email completed document to customer" on any
// deployment other than local dev, since the request was going to
// localhost:3000 on the admin's own machine instead of the real backend.
const LOCAL_BACKEND_BASE = API_BASE_URL;
const COMPLETED_FILE_SUBMIT_TIMEOUT_MS = 8000;

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  data?: string; // base64 - Optional, excluded in list view for performance
  localFile?: File; // Pending upload only; never persisted
  hasFile?: boolean; // Flag to indicate file exists (used in list view)
  uploaded_at?: string;
}

interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  totalPrice: number;
  pageCount: number;
  sourceLanguage?: string;
  targetLanguage?: string;
  certificateType?: string;
  documentType?: string;
  category?: string;
  driveLink?: string;
  uploadedFile?: UploadedFile | null; // Keep for backward compatibility
  uploadedFiles?: UploadedFile[]; // Support multiple files
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name?: string;
  customer_email?: string;
  payment_method: string;
  payment_status: string;
  email_status?: string;
  email_error?: string;
  status: string;
  total_amount: string;
  subtotal: string;
  discount: string;
  tax: string;
  tip?: string; // Add tip field
  currency: string;
  items: OrderItem[];
  shipping_address?: any;
  shipping_details?: {
    email?: string;
    address?: string;
    whatsappNumber?: string;
  };
  shipping_method?: string; // Add shipping method field
  notes?: string; // Add notes field
  tracking_number?: string;
  shipping_carrier?: string;
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
  completed_file?: UploadedFile;
  completed_files?: UploadedFile[];
  completed_file_name?: string;
  completed_at?: string;
  tracking?: {
    stages?: Record<
      string,
      {
        completed?: boolean;
        timestamp?: string;
        details?: string;
      }
    >;
  };
  created_at: string;
  updated_at: string;
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { accessToken, loading: authLoading, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [uploadingCompletedFile, setUploadingCompletedFile] = useState(false);
  const [submittingCompletedFile, setSubmittingCompletedFile] = useState(false);
  const [pendingCompletedFiles, setPendingCompletedFiles] = useState<UploadedFile[]>([]);
  const completedFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Wait for auth to complete, then fetch order
    if (authLoading) {
      return;
    }
    
    // Fetch immediately when auth is ready (don't wait for accessToken from context)
    fetchOrder();
  }, [orderId, authLoading]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      console.log('ðŸ“¦ [OrderDetailPage] Fetching order from backend:', orderId);
      
      const url = `${API_URL}/orders/${orderId}`;
      
      const response = await fetch(url, {
        headers: buildHeaders(accessToken)
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedOrder = data.order;
        
        console.log('âœ… [OrderDetailPage] Order loaded from backend');
        const localStorageOrder = loadOrderFromLocalStorage(orderId || '');
        const mergedOrder = localStorageOrder
          ? {
              ...fetchedOrder,
              shipping_details: {
                ...((fetchedOrder.shipping_details || {})),
                ...((localStorageOrder.shipping_details || {})),
              },
              shipping_method: fetchedOrder.shipping_method || localStorageOrder.shipping_method,
              shipping_address: fetchedOrder.shipping_address || localStorageOrder.shipping_address,
            }
          : fetchedOrder;

        if (localStorageOrder) {
          console.log('â„¹ [OrderDetailPage] Merged backend order with local storage shipping details');
        }

        setOrder(mergedOrder);
        setNewStatus(mergedOrder.status);
        setTrackingNumber(mergedOrder.tracking_number || '');
        setShippingCarrier(mergedOrder.shipping_carrier || '');
        setNotes(mergedOrder.notes || '');
      } else {
        console.log('  [OrderDetailPage] Backend unavailable, checking localStorage...');
        
        // FALLBACK: Try to load from localStorage
        const localStorageOrder = orderId ? loadOrderFromLocalStorage(orderId) : null;
        
        if (localStorageOrder) {
          console.log('âœ… [OrderDetailPage] Order loaded from localStorage');
          setOrder(localStorageOrder);
          setNewStatus(localStorageOrder.status);
          setTrackingNumber(localStorageOrder.tracking_number || '');
          setShippingCarrier(localStorageOrder.shipping_carrier || '');
          setNotes(localStorageOrder.notes || '');
          
          // Show info message that database needs setup
          toast.info('Order loaded from browser storage. Set up the database to enable full features.', {
            duration: 5000
          });
        } else {
          console.error('âŒ [OrderDetailPage] Order not found in backend or localStorage');
          toast.error('Order not found');
          navigate('/admin/sales/orders');
        }
      }
    } catch (error) {
      console.error('âŒ [OrderDetailPage] Error loading order:', error);
      
      // FALLBACK: Try to load from localStorage on error
      const localStorageOrder = orderId ? loadOrderFromLocalStorage(orderId) : null;
      
      if (localStorageOrder) {
        console.log('âœ… [OrderDetailPage] Order loaded from localStorage (after error)');
        setOrder(localStorageOrder);
        setNewStatus(localStorageOrder.status);
        setTrackingNumber(localStorageOrder.tracking_number || '');
        setShippingCarrier(localStorageOrder.shipping_carrier || '');
        setNotes(localStorageOrder.notes || '');
        
        toast.info('Backend unavailable. Order loaded from browser storage.', {
          duration: 5000
        });
      } else {
        toast.error('Failed to load order');
        navigate('/admin/sales/orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      
      const url = `${API_URL}/orders/${order.id}/status`;
      
      console.log('ðŸ“¦ [OrderDetailPage] Updating order status to:', newStatus);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: buildHeaders(accessToken),
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNumber || undefined,
          shipping_carrier: shippingCarrier || undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        console.log('âœ… [OrderDetailPage] Order status updated:', data);
        
        setOrder(data.order);
        setShowStatusModal(false);
        toast.success('Order updated successfully');
        
        // Refresh the order
        fetchOrder();
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if it's a backend deployment issue
        const isBackendIssue = errorData.code === 401 || 
                               errorData.message?.includes('Invalid JWT') ||
                               errorData.message?.includes('Missing authorization header');
        
        if (isBackendIssue) {
          console.log('â„¹ Backend not deployed - order updates unavailable');
          toast.error('Backend not deployed. Order updates require Backend Edge Functions.');
        } else {
          console.log('â„¹ Failed to update order:', errorData);
          toast.error('Failed to update order');
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('â„¹ Order update request timed out');
        toast.error('Request timed out. Please try again.');
      } else {
        console.log('â„¹ Error updating order:', error.message);
        toast.error('Failed to update order');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleTogglePaymentStatus = async () => {
    if (!order) {
      toast.error('Order not found');
      return;
    }

    const nextStatus = order.payment_status === 'paid' ? 'unpaid' : 'paid';

    try {
      setUpdating(true);

      const url = `${API_URL}/orders/${order.id}/payment-status`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: buildHeaders(accessToken),
        body: JSON.stringify({
          payment_status: nextStatus
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        toast.success(`Marked as ${nextStatus}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to update payment status');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Failed to update payment status');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleResendEmail = async () => {
    if (!order) {
      toast.error('Order not found');
      return;
    }

    try {
      setUpdating(true);

      const url = `${API_URL}/orders/${order.id}/resend-email`;

      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(accessToken)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        if (data.order) setOrder(data.order);
        toast.success('Email resent to customer');
      } else {
        toast.error(data.message || 'Failed to resend email');
      }
    } catch (error) {
      toast.error('Failed to resend email');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!order) {
      toast.error('Order not found');
      return;
    }

    try {
      setUpdating(true);
      
      const url = `${API_URL}/orders/${order.id}/notes`;
      
      console.log('ðŸ“ [OrderDetailPage] Updating order notes');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: buildHeaders(accessToken),
        body: JSON.stringify({
          notes: notes
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        console.log('âœ… [OrderDetailPage] Order notes updated:', data);
        
        setOrder(data.order);
        setShowNotesModal(false);
        toast.success('Notes updated successfully');
        
        // Refresh the order
        fetchOrder();
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if it's a backend deployment issue
        const isBackendIssue = errorData.code === 401 || 
                               errorData.message?.includes('Invalid JWT') ||
                               errorData.message?.includes('Missing authorization header');
        
        if (isBackendIssue) {
          console.log('â„¹ Backend not deployed - note updates unavailable');
          toast.error('Backend not deployed. Order note updates require Backend Edge Functions.');
        } else {
          console.log('â„¹ Failed to update notes:', errorData);
          toast.error('Failed to update notes');
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('â„¹ Order note update request timed out');
        toast.error('Request timed out. Please try again.');
      } else {
        console.log('â„¹ Error updating notes:', error.message);
        toast.error('Failed to update notes');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) {
      toast.error('Order not found');
      return;
    }

    try {
      console.log('ðŸ“„ [OrderDetailPage] Generating invoice PDF for order:', order.order_number);
      
      // Generate and download invoice PDF
      await generateInvoicePDF(order);
      
      toast.success('Invoice PDF downloaded successfully');
      console.log('âœ… [OrderDetailPage] Invoice PDF downloaded:', order.order_number);
    } catch (error) {
      console.error('âŒ [OrderDetailPage] Failed to download invoice PDF:', error);
      toast.error('Failed to generate invoice PDF');
    }
  };

  const handleDownloadDocument = async (file: UploadedFile, itemName: string) => {
    try {
      console.log('ðŸ“„ [OrderDetailPage] Downloading document:', file.name);
      
      // Check if file has data
      if (!file.data) {
        toast.error('File data not available');
        return;
      }

      // Convert base64 to blob
      const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Create blob with original MIME type to preserve file format
      const blob = new Blob([byteArray], { type: file.type || 'application/octet-stream' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename preserving original extension: OrderNumber_ItemName_OriginalFileName
      const sanitizedItemName = itemName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      const filename = `${order?.order_number}_${sanitizedItemName}_${file.name}`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Document downloaded successfully as ${file.name.split('.').pop()?.toUpperCase()} format`);
      console.log('âœ… [OrderDetailPage] Document downloaded:', filename);
    } catch (error) {
      console.error('âŒ [OrderDetailPage] Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  const getDownloadableDriveLink = (rawLink: string) => {
    const link = rawLink.trim();
    if (!link) return '';

    const fileMatch = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch?.[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
    }

    const openIdMatch = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch?.[1]) {
      return `https://drive.google.com/uc?export=download&id=${openIdMatch[1]}`;
    }

    return link;
  };

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const syncOrderInLocalStorage = (updatedOrder: Order) => {
    const storageKeys = ['user_orders', ORDERS_STORAGE_KEY];
    for (const key of storageKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;
        const nextOrders = parsed.map((storedOrder: Order) =>
          storedOrder.id === updatedOrder.id ? updatedOrder : storedOrder
        );
        localStorage.setItem(key, JSON.stringify(nextOrders));
      } catch (error) {
        console.error(`Failed to sync ${key}:`, error);
      }
    }
  };

  const getSubmittedCompletedFiles = (currentOrder: Order | null) => {
    if (!currentOrder) return [];
    if (currentOrder.completed_files?.length) return currentOrder.completed_files;
    if (currentOrder.completed_file) return [currentOrder.completed_file];
    return [];
  };

  const getDeliveryEmail = (currentOrder: Order) => {
    // Physical-delivery orders (and any older orders placed before the delivery
    // email field existed) don't have shipping_details.email set. Fall back to
    // the customer's account email so the softcopy PDF can still be sent.
    return (currentOrder.shipping_details?.email || currentOrder.customer_email || '').trim();
  };

  const sendCompletedFilesByEmail = async (files: UploadedFile[]) => {
    if (!order) return;

    const deliveryEmail = getDeliveryEmail(order);

    if (!deliveryEmail) {
      throw new Error('Delivery address email is not available for this order');
    }

    const localFiles = files
      .map((file) => file.localFile)
      .filter((file): file is File => Boolean(file));

    if (localFiles.length === files.length && localFiles.length > 0) {
      const formData = new FormData();
      formData.append('email', deliveryEmail);
      formData.append('orderNumber', order.order_number);
      formData.append('orderId', order.id);
      localFiles.forEach((file) => {
        formData.append(localFiles.length === 1 ? 'document' : 'documents', file, file.name);
      });

      const response = await fetch(`${LOCAL_BACKEND_BASE}/api/send-document`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        const message = data.message || data.providerMessage || 'Failed to email completed document';
        const providerDetails = data.providerMessage && data.providerMessage !== message
          ? ` Resend details: ${data.providerMessage}`
          : '';
        throw new Error(`${getFriendlyEmailErrorMessage(message)}${providerDetails}`);
      }

      return;
    }

    const attachments = files.map((file) => ({
      filename: file.name,
      type: file.type || 'application/octet-stream',
      content: file.data,
    }));

    const response = await fetch(`${LOCAL_BACKEND_BASE}/api/send-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: deliveryEmail,
        orderNumber: order.order_number,
        orderId: order.id,
        attachments,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      const message = data.message || data.providerMessage || 'Failed to email completed document';
      const providerDetails = data.providerMessage && data.providerMessage !== message
        ? ` Resend details: ${data.providerMessage}`
        : '';
      throw new Error(`${getFriendlyEmailErrorMessage(message)}${providerDetails}`);
    }
  };

  const getFriendlyEmailErrorMessage = (message: string) => {
    const normalizedMessage = String(message || '').toLowerCase();

    if (
      normalizedMessage.includes('unrecognised ip') ||
      normalizedMessage.includes('unrecognized ip') ||
      normalizedMessage.includes('unauthorised ip') ||
      normalizedMessage.includes('unauthorized ip') ||
      normalizedMessage.includes('authorised_ips') ||
      normalizedMessage.includes('authorized_ips')
    ) {
      return 'Resend blocked this email. Please check the verified sender/domain and API key in backend/.env, then click Submit again.';
    }

    return message;
  };

  const handleUploadCompletedFile = async (files: FileList | File[]) => {
    try {
      setUploadingCompletedFile(true);

      const normalizedFiles = Array.from(files);
      const preparedFiles = await Promise.all(
        normalizedFiles.map(async (file) => {
          const base64 = await convertFileToBase64(file);
          const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
          return {
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            data: base64Data,
            localFile: file,
            hasFile: true,
            uploaded_at: new Date().toISOString(),
          } as UploadedFile;
        })
      );

      setPendingCompletedFiles(prev => [...prev, ...preparedFiles]);

      toast.success(
        `${preparedFiles.length} file${preparedFiles.length > 1 ? 's' : ''} uploaded. Click Submit to publish ${preparedFiles.length > 1 ? 'them' : 'it'} to the customer page.`
      );
    } catch (error) {
      console.error('Error preparing completed file:', error);
      toast.error('Failed to upload final translated file');
    } finally {
      setUploadingCompletedFile(false);
    }
  };

  const getPersistableCompletedFiles = (files: UploadedFile[]) =>
    files.map(({ localFile, ...file }) => file);

  // Email delivery is a notification, not the core action — the completed
  // file must still get submitted/saved even if the email provider rejects
  // it (e.g. Resend sandbox mode only allowing mail to the account owner).
  // This wraps sendCompletedFilesByEmail so a failure here never blocks the
  // actual submit flow below; it just surfaces a warning toast instead.
  const trySendCompletedFilesByEmail = async (files: UploadedFile[]): Promise<boolean> => {
    try {
      await sendCompletedFilesByEmail(files);
      return true;
    } catch (error) {
      console.error('Non-blocking: failed to email completed files:', error);
      const message = error instanceof Error ? error.message : 'Failed to email the completed document';
      toast.warning(`File submitted, but the notification email could not be sent. ${message}`);
      return false;
    }
  };

  const handleSubmitCompletedFile = async () => {
    if (!order || pendingCompletedFiles.length === 0) {
      toast.error('Please upload at least one file before submitting');
      return;
    }

    try {
      setSubmittingCompletedFile(true);

      if (pendingCompletedFiles.length > 1) {
        const submittedAt = new Date().toISOString();
        const localFiles = getPersistableCompletedFiles(pendingCompletedFiles).map((file) => ({
          ...file,
          uploaded_at: submittedAt,
        }));
        const emailed = await trySendCompletedFilesByEmail(pendingCompletedFiles);
        const fallbackOrder: Order = {
          ...order,
          completed_files: localFiles,
          completed_file: localFiles[0],
          completed_file_name: localFiles[0].name,
          completed_at: submittedAt,
          updated_at: submittedAt,
        };
        setOrder(fallbackOrder);
        syncOrderInLocalStorage(fallbackOrder);
        setPendingCompletedFiles([]);
        if (emailed) {
          toast.success('Files submitted locally and emailed to the delivery address.');
        } else {
          toast.success('Files submitted locally.');
        }
        return;
      }

      const [pendingCompletedFile] = pendingCompletedFiles;
      const emailedSingle = await trySendCompletedFilesByEmail(pendingCompletedFiles);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), COMPLETED_FILE_SUBMIT_TIMEOUT_MS);

      const response = await fetch(
        `${API_URL}/orders/${order.id}/completed-file`,
        {
          method: 'PATCH',
          headers: buildHeaders(accessToken),
          body: JSON.stringify({
            file: {
              name: pendingCompletedFile.name,
              type: pendingCompletedFile.type || 'application/octet-stream',
              size: pendingCompletedFile.size,
              data: `data:${pendingCompletedFile.type || 'application/octet-stream'};base64,${pendingCompletedFile.data}`
            }
          }),
          signal: controller.signal
        }
      ).finally(() => clearTimeout(timeout));

      if (response.ok) {
        const data = await response.json();
        const submittedFiles = getPersistableCompletedFiles(pendingCompletedFiles);
        const submittedOrder: Order = {
          ...data.order,
          completed_files: submittedFiles,
        };

        setOrder(submittedOrder);
        syncOrderInLocalStorage(submittedOrder);
        setPendingCompletedFiles([]);
        toast.success(
          emailedSingle
            ? 'Final translated file submitted and emailed successfully'
            : 'Final translated file submitted successfully'
        );

        return;
      }

      const errorData = await response.json().catch(() => ({}));
      console.log('Failed to submit file to backend, using local fallback:', errorData);

      const fallbackOrder: Order = {
        ...order,
        completed_files: getPersistableCompletedFiles(pendingCompletedFiles),
        completed_file: getPersistableCompletedFiles([pendingCompletedFile])[0],
        completed_file_name: pendingCompletedFile.name,
        completed_at: pendingCompletedFile.uploaded_at,
        updated_at: new Date().toISOString(),
      };
      setOrder(fallbackOrder);
      syncOrderInLocalStorage(fallbackOrder);
      setPendingCompletedFiles([]);
      toast.success(emailedSingle ? 'File submitted locally and emailed to the delivery address.' : 'File submitted locally.');
    } catch (error) {
      console.error('Error submitting completed file:', error);
      if (error instanceof Error && error.name === 'AbortError' && order) {
        const submittedAt = new Date().toISOString();
        const fallbackOrder: Order = {
          ...order,
          completed_files: getPersistableCompletedFiles(pendingCompletedFiles),
          completed_file: getPersistableCompletedFiles(pendingCompletedFiles)[0],
          completed_file_name: pendingCompletedFiles[0]?.name,
          completed_at: submittedAt,
          updated_at: submittedAt,
        };

        setOrder(fallbackOrder);
        syncOrderInLocalStorage(fallbackOrder);
        setPendingCompletedFiles([]);
        toast.success('File saved locally because the order update timed out.');
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Failed to submit completed document');
    } finally {
      setSubmittingCompletedFile(false);
    }
  };

  const handleRemovePendingCompletedFile = (index: number) => {
    setPendingCompletedFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index));
    toast.success('Uploaded file removed');
  };

  const handleDownloadCompletedFile = async (file?: UploadedFile) => {
    if (!order) return;

    if (file?.data) {
      const mimeType = file.type || 'application/octet-stream';
      const dataUrl = file.data.startsWith('data:')
        ? file.data
        : `data:${mimeType};base64,${file.data}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = file.name || 'translated-document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/orders/${order.id}/download-completed-file`,
        {
          headers: buildHeaders(accessToken)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'File not available');
      }

      const data = await response.json();
      const link = document.createElement('a');
      link.href = data.dataUrl || data.downloadUrl;
      link.download = data.fileName || order.completed_file_name || 'translated-document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file');
    }
  };

  const getOrderStatusTimeline = () => {
    if (!order) return [];

    const stages = order.tracking?.stages || {};
    const stageCompleted = (stageId: string) => Boolean(stages?.[stageId]?.completed);
    const stageTimestamp = (stageId: string) => stages?.[stageId]?.timestamp;
    
    const statuses = [
      { 
        label: 'Received', 
        completed: stageCompleted('received') || true, 
        date: stageTimestamp('received') || order.created_at,
        icon: Package
      },
      { 
        label: 'Payment Received', 
        completed: stageCompleted('payment_received') || order.payment_status === 'paid',
        date: stageTimestamp('payment_received') || order.created_at,
        icon: DollarSign
      },
      { 
        label: 'Confirmed', 
        completed:
          stageCompleted('confirmed') ||
          ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status),
        date: stageTimestamp('confirmed') || order.updated_at,
        icon: CheckCircle
      },
      { 
        label: 'Yet To Be Shipped', 
        completed:
          stageCompleted('courier') ||
          stageCompleted('shipped') ||
          ['shipped', 'delivered'].includes(order.status),
        date:
          stageTimestamp('courier') ||
          stageTimestamp('shipped') ||
          order.shipped_at,
        icon: Truck
      },
      { 
        label: 'Out For Delivery', 
        completed: stageCompleted('shipped') || order.status === 'delivered',
        date: stageTimestamp('shipped') || order.delivered_at,
        icon: Package
      }
    ];
    
    return statuses;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <p className="text-gray-600">Order not found</p>
        </div>
      </AdminLayout>
    );
  }

  const timeline = getOrderStatusTimeline();
  const submittedCompletedFiles = getSubmittedCompletedFiles(order);

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/sales/orders')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Sales Order #{order.order_number}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Created on {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                title="Download Invoice PDF"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Update Status
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Timeline */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
                
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {timeline.map((status, index) => {
                      const Icon = status.icon;
                      return (
                        <div key={index} className="relative flex items-start gap-4">
                          <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                            status.completed 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 pt-2">
                            <h3 className={`font-medium ${
                              status.completed ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {status.label}
                            </h3>
                            {status.completed && status.date && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {new Date(status.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Shipment & Payment Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment & Payment</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      {order.shipping_method === 'physical' ? 'Tracking Information' : 'Delivery Information'}
                    </h3>
                    <div className="space-y-2">
                      {order.shipping_method === 'physical' ? (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Tracking Number</p>
                            <p className="text-sm font-medium text-gray-900">
                              {order.tracking_number || 'Not assigned'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Carrier</p>
                            <p className="text-sm font-medium text-gray-900">
                              {order.shipping_carrier || 'Not assigned'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Delivery Email</p>
                            <p className="text-sm font-medium text-gray-900 break-all">
                              {order.shipping_details?.email || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">WhatsApp Number</p>
                            <p className="text-sm font-medium text-gray-900">
                              {order.shipping_details?.whatsappNumber || 'Not provided'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Payment Details</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Payment Method</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {order.payment_method}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Status</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          order.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                        <button
                          type="button"
                          onClick={handleTogglePaymentStatus}
                          disabled={updating}
                          className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                        >
                          Mark as {order.payment_status === 'paid' ? 'Unpaid' : 'Paid'}
                        </button>
                      </div>
                      {order.email_status && order.email_status !== 'not_sent' && (
                        <div>
                          <p className="text-xs text-gray-500">Document Email</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              order.email_status === 'sent'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.email_status === 'sent' ? 'Sent' : 'Failed'}
                            </span>
                            {order.email_status === 'failed' && (
                              <button
                                type="button"
                                onClick={handleResendEmail}
                                disabled={updating}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                              >
                                Retry
                              </button>
                            )}
                          </div>
                          {order.email_status === 'failed' && order.email_error && (
                            <p className="text-xs text-red-600 mt-1">{order.email_error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h2>
                
                <div className="space-y-4">
                  {order.items
                    .filter((item, index, all) =>
                      // Guard against the same product appearing more than
                      // once in the stored items array (e.g. duplicate id).
                      all.findIndex((other) => (other.id ?? other.name) === (item.id ?? item.name)) === index
                    )
                    .map((item, index) => (
                    <div 
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      {/* Item Name */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                          {(() => {
                            const fileCount = (item.uploadedFiles?.length || (item.uploadedFile ? 1 : 0));
                            if (fileCount > 0) {
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                  <Paperclip className="w-3 h-3" />
                                  {fileCount} {fileCount === 1 ? 'file' : 'files'}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {order.currency && order.currency !== 'INR' ? '$' : '₹'}{Number(item.totalPrice || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Item Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Page Count</p>
                          <p className="font-medium text-gray-900">{item.pageCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rate Per Page</p>
                          <p className="font-medium text-gray-900">
                            {order.currency && order.currency !== 'INR' ? '$' : '₹'}{Number(item.basePrice || 0).toFixed(2)}
                          </p>
                        </div>
                        
                        {item.sourceLanguage && (
                          <div>
                            <p className="text-xs text-gray-500">Source Language</p>
                            <p className="font-medium text-gray-900">{item.sourceLanguage}</p>
                          </div>
                        )}
                        
                        {item.targetLanguage && (
                          <div>
                            <p className="text-xs text-gray-500">Target Language</p>
                            <p className="font-medium text-gray-900">{item.targetLanguage}</p>
                          </div>
                        )}
                        
                        {item.certificateType && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Document Type</p>
                            <p className="font-medium text-gray-900">{item.certificateType}</p>
                          </div>
                        )}
                        
                        {item.category && !item.certificateType && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="font-medium text-gray-900 capitalize">{item.category}</p>
                          </div>
                        )}
                        
                        {/* Display all uploaded documents */}
                        {(() => {
                          const files = item.uploadedFiles || (item.uploadedFile ? [item.uploadedFile] : []);
                          const hasDriveLink = Boolean(item.driveLink?.trim());
                          if (files.length === 0 && !hasDriveLink) return null;
                          
                          return (
                            <div className="col-span-2">
                              {files.length > 0 && (
                                <p className="text-xs text-gray-500 mb-2">
                                  Uploaded Document{files.length > 1 ? 's' : ''} ({files.length})
                                </p>
                              )}
                              <div className="space-y-2">
                                {files.map((file, fileIndex) => {
                                  // Extract file extension
                                  const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                                  const extensionColors: Record<string, string> = {
                                    'PDF': 'bg-red-100 text-red-700 border-red-300',
                                    'DOC': 'bg-blue-100 text-blue-700 border-blue-300',
                                    'DOCX': 'bg-blue-100 text-blue-700 border-blue-300',
                                    'JPG': 'bg-green-100 text-green-700 border-green-300',
                                    'JPEG': 'bg-green-100 text-green-700 border-green-300',
                                    'PNG': 'bg-green-100 text-green-700 border-green-300',
                                    'TXT': 'bg-gray-100 text-gray-700 border-gray-300',
                                  };
                                  const extensionColor = extensionColors[fileExtension] || 'bg-purple-100 text-purple-700 border-purple-300';
                                  
                                  return (
                                    <div key={fileIndex} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm text-blue-900 font-medium truncate block">
                                          {file.name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${extensionColor}`}>
                                            {fileExtension}
                                          </span>
                                          <span className="text-xs text-blue-600">
                                            {(file.size / 1024).toFixed(2)} KB
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDownloadDocument(file, item.name)}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 font-medium text-sm flex-shrink-0"
                                        title={`Download as ${fileExtension}`}
                                      >
                                        <Download className="w-4 h-4" />
                                        Download
                                      </button>
                                    </div>
                                  );
                                })}
                                {hasDriveLink && (
                                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded px-3 py-2">
                                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm text-indigo-900 font-medium block">Drive Link</span>
                                      <span className="text-xs text-indigo-700 truncate block">
                                        {item.driveLink}
                                      </span>
                                    </div>
                                    <a
                                      href={getDownloadableDriveLink(item.driveLink || '')}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 font-medium text-sm flex-shrink-0"
                                    >
                                      <Download className="w-4 h-4" />
                                      Open
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Total */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">
                          {order.currency && order.currency !== 'INR' ? '$' : '₹'}{parseFloat(order.subtotal).toFixed(2)}
                        </span>
                      </div>
                      {parseFloat(order.discount) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discount</span>
                          <span className="text-green-600">
                            -{order.currency && order.currency !== 'INR' ? '$' : '₹'}{parseFloat(order.discount).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (18%)</span>
                        <span className="text-gray-900">
                          {order.currency && order.currency !== 'INR' ? '$' : '₹'}{parseFloat(order.tax).toFixed(2)}
                        </span>
                      </div>
                      {order.tip && parseFloat(order.tip) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tip</span>
                          <span className="text-gray-900">
                            {order.currency && order.currency !== 'INR' ? '$' : '₹'}{parseFloat(order.tip).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">
                          {order.currency && order.currency !== 'INR' ? '$' : '₹'}{parseFloat(order.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Notes Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
                  </div>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Notes
                  </button>
                </div>
                
                {order.notes ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {order.notes}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 border-dashed">
                    <p className="text-sm text-gray-500 text-center">
                      No notes added yet
                    </p>
                  </div>
                )}
                
                <div className="mt-3">
                  <p className="text-xs text-gray-500">
                    Customer instructions and special requirements
                  </p>
                </div>
              </div>

              {/* Final Translated Document Upload */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Final Translated Document</h2>
                  </div>
                  {pendingCompletedFiles.length > 0 ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                      Ready to Submit
                    </span>
                  ) : submittedCompletedFiles.length > 0 ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      Submitted
                    </span>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {uploadingCompletedFile ? 'Uploading...' : 'Upload Final Copy'}
                      <input
                        ref={completedFileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        disabled={uploadingCompletedFile || submittingCompletedFile}
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            handleUploadCompletedFile(e.target.files);
                          }
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>

                    {pendingCompletedFiles.length > 0 && (
                      <>
                        <button
                          onClick={() => completedFileInputRef.current?.click()}
                          type="button"
                          disabled={uploadingCompletedFile || submittingCompletedFile}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Add More
                        </button>
                        <button
                          onClick={handleSubmitCompletedFile}
                          type="button"
                          disabled={uploadingCompletedFile || submittingCompletedFile}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {submittingCompletedFile ? 'Submitting...' : 'Submit'}
                        </button>
                      </>
                    )}
                  </div>

                  {pendingCompletedFiles.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-amber-900 mb-3">
                        Pending file{pendingCompletedFiles.length > 1 ? 's' : ''} ({pendingCompletedFiles.length})
                      </p>
                      <div className="space-y-2">
                        {pendingCompletedFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-amber-900 truncate">{file.name}</p>
                              <p className="text-xs text-amber-700 mt-1">
                                Uploaded on{' '}
                                {file.uploaded_at
                                  ? new Date(file.uploaded_at).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemovePendingCompletedFile(index)}
                              type="button"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-amber-700 mt-3">
                        These files are not visible on the customer page yet. Click Submit to publish them.
                      </p>
                    </div>
                  ) : submittedCompletedFiles.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-900 mb-3">
                        Submitted file{submittedCompletedFiles.length > 1 ? 's' : ''} ({submittedCompletedFiles.length})
                      </p>
                      <div className="space-y-2">
                        {submittedCompletedFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-white px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-green-900 truncate">{file.name}</p>
                              <p className="text-xs text-green-700 mt-1">
                                Submitted on{' '}
                                {order.completed_at
                                  ? new Date(order.completed_at).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDownloadCompletedFile(file)}
                              type="button"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-green-700 mt-3">
                        Customers can now download these files from the Track Order screen.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        Upload the final translated copy here. Use the + button to add more files. They will stay hidden from the customer page until you click Submit.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Customer Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.customer_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.customer_email || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {order.shipping_method && (
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Shipping Method</p>
                        <p className="text-sm text-gray-900">
                          {order.shipping_method === 'email'
                            ? 'Email Delivery'
                            : 'Physical Delivery'}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.shipping_method === 'email' ? (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Delivery Address</p>
                        <p className="text-sm text-gray-900">
                          {order.shipping_details?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Delivery Address</p>
                        {order.shipping_details?.address ? (
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {order.shipping_details.address}
                          </p>
                        ) : order.shipping_address ? (
                          (() => {
                            let addr = order.shipping_address;
                            if (typeof addr === 'string') {
                              try {
                                addr = JSON.parse(addr);
                              } catch {
                                // Not JSON, keep as plain text string
                              }
                            }
                            if (typeof addr === 'string') {
                              return <p className="text-sm text-gray-900 whitespace-pre-wrap">{addr}</p>;
                            }
                            return (
                              <p className="text-sm text-gray-900">
                                {addr.name && <>{addr.name}<br /></>}
                                {(addr.phoneCountryCode || addr.phone) && (
                                  <>
                                    {addr.phone && addr.phoneCountryCode && addr.phone.trim().startsWith(addr.phoneCountryCode)
                                      ? addr.phone.trim()
                                      : `${addr.phoneCountryCode || ''}${addr.phone || ''}`}
                                    <br />
                                  </>
                                )}
                                {addr.addressLine1 && <>{addr.addressLine1}<br /></>}
                                {addr.addressLine2 && <>{addr.addressLine2}<br /></>}
                                {addr.address1 && <>{addr.address1}<br /></>}
                                {addr.city ? `${addr.city}, ` : ''}{addr.state || ''}<br />
                                {addr.postalCode && <>{addr.postalCode}<br /></>}
                                {addr.country}
                              </p>
                            );
                          })()
                        ) : (
                          <p className="text-sm text-gray-900">N/A</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Order Number</p>
                    <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Order Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' || order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  
                  {order.shipping_method && (
                    <div>
                      <p className="text-xs text-gray-500">Shipping Method</p>
                      <p className="text-sm text-gray-900">
                        {order.shipping_method === 'email' 
                          ? 'Email Delivery (Digital)' 
                          : 'Physical Delivery (Courier)'}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-gray-500">Created Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  {order.estimated_delivery && (
                    <div>
                      <p className="text-xs text-gray-500">Estimated Delivery</p>
                      <p className="text-sm text-gray-900">
                        {new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Update Order Status</h2>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="received">Received</option>
                    <option value="payment-received">Payment Received</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="document-analysis">Document Analysis</option>
                    <option value="translator-working">Translator Working</option>
                    <option value="formatting">Formatting</option>
                    <option value="proof-checking">Proof Checking</option>
                    <option value="draft">Draft</option>
                    <option value="soft">Soft</option>
                    <option value="courier">Courier</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {(newStatus === 'shipped' || newStatus === 'delivered') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Carrier
                      </label>
                      <input
                        type="text"
                        value={shippingCarrier}
                        onChange={(e) => setShippingCarrier(e.target.value)}
                        placeholder="e.g., FedEx, DHL, Blue Dart"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || !newStatus}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Update Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Update Order Notes</h2>
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateNotes}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Notes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default OrderDetailPage;

// Helper function to load order from localStorage
const loadOrderFromLocalStorage = (orderId: string): Order | null => {
  try {
    // Check both user_orders and admin orders storage
    const userOrdersStr = localStorage.getItem('user_orders');
    const adminOrdersStr = localStorage.getItem(ORDERS_STORAGE_KEY);
    
    const allOrders: Order[] = [];
    
    if (userOrdersStr) {
      try {
        const userOrders = JSON.parse(userOrdersStr);
        allOrders.push(...userOrders);
      } catch (e) {
        console.error('Failed to parse user_orders:', e);
      }
    }
    
    if (adminOrdersStr) {
      try {
        const adminOrders = JSON.parse(adminOrdersStr);
        allOrders.push(...adminOrders);
      } catch (e) {
        console.error('Failed to parse admin orders:', e);
      }
    }
    
    // Find order by ID
    const foundOrder = allOrders.find(o => o.id === orderId);
    
    if (foundOrder) {
      console.log('ðŸ“¦ [OrderDetailPage] Found order in localStorage:', foundOrder.order_number);
      return foundOrder;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

