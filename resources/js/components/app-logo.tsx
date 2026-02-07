import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex items-center">
                <div className="flex aspect-square size-8 items-center justify-center">
                    <AppLogoIcon className="size-6" />
                </div>
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="truncate leading-tight font-semibold">
                        TandainLink
                    </span>
                </div>
            </div>
        </>
    );
}
