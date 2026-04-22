export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="shrink-0 border-t border-sidebar-border bg-sidebar px-4 md:px-6 py-6.5 transition-colors duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                <p>© {currentYear} I-UM System. All rights reserved.</p>
                {/* <div className="flex items-center gap-4">
                    <a
                        href="#"
                        className="hover:text-foreground transition-colors"
                        tabIndex={0}
                        aria-label="이용약관"
                    >
                        이용약관
                    </a>
                    <a
                        href="#"
                        className="hover:text-foreground transition-colors"
                        tabIndex={0}
                        aria-label="개인정보처리방침"
                    >
                        개인정보처리방침
                    </a>
                    <a
                        href="#"
                        className="hover:text-foreground transition-colors"
                        tabIndex={0}
                        aria-label="고객센터"
                    >
                        고객센터
                    </a>
                </div> */}
            </div>
        </footer>
    )
}
