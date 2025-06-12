import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {toast} from 'react-toastify';
import '../styles/Sidebar.css';

/**
 * Sidebar component that provides navigation links and logout functionality.
 */
function Sidebar() {
    const {logout} = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    /**
     * Check if screen is mobile size
     */
    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsMobileMenuOpen(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    /**
     * Handles user logout.
     */
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth');
        } catch (error) {
            toast.error('Помилка при виході');
        }
    };

    /**
     * Toggles the sidebar between collapsed and expanded states.
     */
    const toggleSidebar = () => {
        if (isMobile) {
            setIsMobileMenuOpen(!isMobileMenuOpen);
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    /**
     * Closes mobile menu when clicking on a link
     */
    const handleLinkClick = () => {
        if (isMobile) {
            setIsMobileMenuOpen(false);
        }
    };

    if (isMobile) {
        return (
            <>
                <div className="mobile-header">
                    <h2>TUMBOCHKA</h2>
                    <button onClick={toggleSidebar} className="mobile-toggle-btn">
                        <i className={`bx ${isMobileMenuOpen ? 'bx-x' : 'bx-menu'}`}></i>
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className="mobile-menu-overlay" onClick={toggleSidebar}>
                        <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                            <div className="mobile-menu-content">
                                <div className="mobile-menu-section">
                                    <h3>ЗАГАЛЬНЕ</h3>
                                    <ul>
                                        <li>
                                            <Link to="/history" onClick={handleLinkClick}>
                                                <i className="bx bx-home-alt"></i>
                                                <span>Домашня сторінка</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/savings" onClick={handleLinkClick}>
                                                <i className="bx bx-wallet"></i>
                                                <span>Накопичення</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/calculator" onClick={handleLinkClick}>
                                                <i className="bx bx-math"></i>
                                                <span>Калькулятор</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mobile-menu-section">
                                    <h3>БАЛАНС</h3>
                                    <ul>
                                        <li>
                                            <Link to="/transactions" onClick={handleLinkClick}>
                                                <i className="bx bx-transfer"></i>
                                                <span>Транзакції</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/categories" onClick={handleLinkClick}>
                                                <i className="bx bx-category"></i>
                                                <span>Категорії</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/analytics" onClick={handleLinkClick}>
                                                <i className="bx bx-line-chart"></i>
                                                <span>Аналітика</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mobile-menu-section">
                                    <h3>CASES</h3>
                                    <ul>
                                        <li>
                                            <Link to="/profile" onClick={handleLinkClick}>
                                                <i className="bx bx-user"></i>
                                                <span>Профіль</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/budgets" onClick={handleLinkClick}>
                                                <i className="bx bx-message-square-detail"></i>
                                                <span>Зворотній зв'язок</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mobile-menu-footer">
                                    <h3 className="logout-btn" onClick={handleLogout}>
                                        <i className="bx bx-log-out"></i>
                                        <span>Вихід</span>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <h2 className={isCollapsed ? 'hidden' : ''}>TUMBOCHKA</h2>
                <button onClick={toggleSidebar} className="toggle-btn">
                    <i className={`bx ${isCollapsed ? 'bx-chevron-right' : 'bx-chevron-left'}`}></i>
                </button>
            </div>
            <div className="sidebar-section">
                <h3 className={isCollapsed ? 'hidden' : ''}>ЗАГАЛЬНЕ</h3>
                <ul>
                    <li>
                        <Link to="/history">
                            <i className="bx bx-home-alt"></i>
                            <span className={isCollapsed ? 'hidden' : ''}>Домашня сторінка</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/savings">
                            <i className="bx bx-wallet"></i>
                            <span className={isCollapsed ? 'hidden' : ''}>Накопичення</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/calculator">
                            <i className="bx bx-math"></i>
                            <span className={isCollapsed ? 'hidden' : ''}>Калькулятор</span>
                        </Link>
                    </li>
                </ul>
            </div>
            <div className="sidebar-section">
                <h3 className={isCollapsed ? 'hidden' : ''}>БАЛАНС</h3>
                <ul>
                    <li>
                        <Link to="/transactions">
                            <i className="bx bx-transfer"></i>
                            <span className={isCollapsed ? 'hidden' : ''}>Транзакції</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/categories">
                            <i className="bx bx-category"></i>
                            <span className={isCollapsed ? 'hidden' : ''}>Категорії</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/analytics">
                            <i className="bx bx-line-chart"></i>
                            <span className={isCollapsed ? 'hidden' : ''}>Аналітика</span>
                        </Link>
                    </li>
                </ul>
            </div>
            <div className="sidebar-section">
                <h3 className={isCollapsed ? 'hidden' : ''}>CASES</h3>
                <ul>
                    <li>
                        <Link to="/profile">
                            <i className="bx bx-user"></i>
                            <span className={isCollapsed ? 'hidden' : ''}>Профіль</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/budgets">
                            <i className="bx bx-message-square-detail"></i>
                            <span className={isCollapsed ? 'hidden' : ''}>Зворотній зв'язок</span>
                        </Link>
                    </li>
                </ul>
            </div>
            <div className="sidebar-footer">
                <h3 className={`logout-btn ${isCollapsed ? 'hidden-text' : ''}`} onClick={handleLogout}>
                    <i className="bx bx-log-out"></i>
                    <span className={isCollapsed ? 'hidden' : ''}>Вихід</span>
                </h3>
            </div>
        </div>
    );
}

export default Sidebar;