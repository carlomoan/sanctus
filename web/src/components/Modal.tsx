import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'full';
}

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }: ModalProps) => {
  if (!isOpen) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'sm:max-w-sm';
      case 'large':
        return 'sm:max-w-4xl';
      case 'xlarge':
        return 'sm:max-w-6xl';
      case 'full':
        return 'sm:max-w-full sm:mx-4';
      case 'medium':
      default:
        return 'sm:max-w-lg';
    }
  };

  const getContainerClasses = () => {
    if (size === 'full') {
      return 'flex min-h-screen items-center justify-center p-0 text-center sm:p-4';
    }
    return 'flex min-h-screen items-center justify-center p-4 text-center sm:p-0';
  };

  const getModalClasses = () => {
    const baseClasses = 'relative transform overflow-hidden rounded-card bg-white text-left shadow-card-lg transition-all sm:my-8 sm:w-full';
    const sizeClasses = getSizeClasses();

    if (size === 'full') {
      return `${baseClasses} ${sizeClasses} h-screen sm:h-auto sm:max-h-[90vh]`;
    }
    return `${baseClasses} ${sizeClasses}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className={getContainerClasses()}>
        <div
          className="fixed inset-0 bg-secondary-900/75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        <div className={getModalClasses()}>
          <div className="bg-white px-6 pb-6 pt-6 sm:p-6 sm:pb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold leading-6 text-secondary-800">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg bg-white text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 focus:outline-none transition-all duration-200 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-2">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
