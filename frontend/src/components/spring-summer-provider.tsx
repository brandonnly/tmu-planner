import { useState, useEffect } from "react";
import { SpringSummerContext } from "@/contexts";

type SpringSummerProviderProps = {
	children: React.ReactNode;
};

export function SpringSummerProvider({ children }: SpringSummerProviderProps) {
	const [hideSpring, setHideSpring] = useState(() => {
		const stored = localStorage.getItem("hide-spring-summer");
		return stored ? JSON.parse(stored) : false;
	});

	useEffect(() => {
		localStorage.setItem("hide-spring-summer", JSON.stringify(hideSpring));
	}, [hideSpring]);

	return (
		<SpringSummerContext.Provider value={{ hideSpring, setHideSpring }}>
			{children}
		</SpringSummerContext.Provider>
	);
}
