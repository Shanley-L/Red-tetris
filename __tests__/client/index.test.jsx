import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the pages
jest.mock('../../client/pages/HomePage', () => {
    return function MockHomePage() {
        return <div data-testid="home-page">Home Page</div>;
    };
});

jest.mock('../../client/pages/GamePage', () => {
    return function MockGamePage() {
        return <div data-testid="game-page">Game Page</div>;
    };
});

// Mock createRoot
const mockRender = jest.fn();
jest.mock('react-dom/client', () => ({
    createRoot: jest.fn(() => ({
        render: mockRender,
    })),
}));

describe('Client Index', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render without crashing', () => {
        // This test ensures the index file can be imported and executed
        expect(() => {
            require('../../client/index.jsx');
        }).not.toThrow();
    });

    test('should create root and render app', () => {
        const { createRoot } = require('react-dom/client');
        
        // Import the index file to trigger the rendering
        require('../../client/index.jsx');
        
        expect(createRoot).toHaveBeenCalled();
        expect(mockRender).toHaveBeenCalled();
    });

    test('should render Router with correct routes', () => {
        // Test that the router is set up correctly
        const indexContent = require('fs').readFileSync(
            require('path').join(__dirname, '../../client/index.jsx'), 
            'utf8'
        );
        
        expect(indexContent).toContain('BrowserRouter');
        expect(indexContent).toContain('Routes');
        expect(indexContent).toContain('Route');
        expect(indexContent).toContain('HomePage');
        expect(indexContent).toContain('GamePage');
    });

    test('should have correct route paths', () => {
        const indexContent = require('fs').readFileSync(
            require('path').join(__dirname, '../../client/index.jsx'), 
            'utf8'
        );
        
        expect(indexContent).toContain('path="/"');
        expect(indexContent).toContain('path="/:roomName/:playerName"');
    });

    test('should import CSS files', () => {
        const indexContent = require('fs').readFileSync(
            require('path').join(__dirname, '../../client/index.jsx'), 
            'utf8'
        );
        
        expect(indexContent).toContain('HomePage.css');
    });

    test('should use createRoot from react-dom/client', () => {
        const indexContent = require('fs').readFileSync(
            require('path').join(__dirname, '../../client/index.jsx'), 
            'utf8'
        );
        
        expect(indexContent).toContain('createRoot');
        expect(indexContent).toContain('react-dom/client');
    });

    test('should render to root element', () => {
        const indexContent = require('fs').readFileSync(
            require('path').join(__dirname, '../../client/index.jsx'), 
            'utf8'
        );
        
        expect(indexContent).toContain('getElementById("root")');
    });

    test('should have proper React imports', () => {
        const indexContent = require('fs').readFileSync(
            require('path').join(__dirname, '../../client/index.jsx'), 
            'utf8'
        );
        
        expect(indexContent).toContain('import React');
        expect(indexContent).toContain('react-router-dom');
    });

    test('should export default or be executable', () => {
        // Test that the file can be executed without errors
        expect(() => {
            // Clear the require cache to ensure fresh import
            delete require.cache[require.resolve('../../client/index.jsx')];
            require('../../client/index.jsx');
        }).not.toThrow();
    });

    test('should have correct file structure', () => {
        const fs = require('fs');
        const path = require('path');
        
        const indexPath = path.join(__dirname, '../../client/index.jsx');
        expect(fs.existsSync(indexPath)).toBe(true);
        
        const stats = fs.statSync(indexPath);
        expect(stats.isFile()).toBe(true);
        expect(stats.size).toBeGreaterThan(0);
    });

    test('should be valid JSX syntax', () => {
        const indexContent = require('fs').readFileSync(
            require('path').join(__dirname, '../../client/index.jsx'), 
            'utf8'
        );
        
        // Basic JSX syntax checks
        expect(indexContent).toContain('<');
        expect(indexContent).toContain('>');
        expect(indexContent).toContain('</');
        expect(indexContent).toContain('Router');
        expect(indexContent).toContain('Routes');
        expect(indexContent).toContain('Route');
    });
});
