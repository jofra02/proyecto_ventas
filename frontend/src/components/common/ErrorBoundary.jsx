import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Dashboard Widget Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <h3 className="font-bold">Widget Error</h3>
                    <pre className="text-xs mt-2 overflow-auto max-h-40">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
