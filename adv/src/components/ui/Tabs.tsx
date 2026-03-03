import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'boxed';
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  fullWidth = false,
  className = '',
  children,
}) => {
  const getTabClasses = (tab: Tab) => {
    const baseClasses = 'tab-btn';
    const isActive = activeTab === tab.id;
    const isDisabled = tab.disabled;

    let variantClasses = '';
    switch (variant) {
      case 'pills':
        variantClasses = 'tab-pill';
        break;
      case 'underline':
        variantClasses = 'tab-underline';
        break;
      case 'boxed':
        variantClasses = 'tab-boxed';
        break;
      default:
        variantClasses = 'tab-default';
    }

    return `${baseClasses} ${variantClasses} ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${fullWidth ? 'full-width' : ''}`;
  };

  return (
    <div className={`tabs-container ${className}`}>
      <div className={`tabs-header tabs-${variant}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={getTabClasses(tab)}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            type="button"
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      {children && <div className="tabs-content">{children}</div>}
    </div>
  );
};

export default Tabs;