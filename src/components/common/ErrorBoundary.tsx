import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Balcad CRM ErrorBoundary Caught]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[360px] flex flex-col items-center justify-center p-8 bg-[#0D121F] border border-red-500/30 rounded-2xl text-center shadow-xl my-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {this.props.fallbackTitle || 'Qaybtaan khalad ayaa ka dhacay (Display Error)'}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            Boggaan wax khalad ah oo lama filaan ah ayaa ku yimid. Xogtaadu waa mid badbaado ah. Fadlan guji batoonka hoose si aad dib ugu cusbooneysiiso.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition active:scale-95 duration-75 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Dib u celi (Retry)</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition active:scale-95 duration-75 cursor-pointer"
            >
              Bogga dhan Cusbooneysii (Reload Page)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
