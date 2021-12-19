# React Draggable List Prototype  [Live Demo](https://ccorcos.github.io/draggable-list)

A well-contained abstraction with simple performant animations.

```ts
export function App() {
	const [list, setList] = useState([0, 1, 2, 3, 4])

	return (
		<div
			style={{
				maxWidth: "100%",
				width: "24em",
				margin: "0 auto",
			}}
		>
			<DraggableList
				items={list}
				onReorder={(removeIndex, insertIndex) => {
					setList(reorder(list, removeIndex, insertIndex))
				}}
				Container={List}
				Item={Item}
			/>
		</div>
	)
}

function List(props: { children: React.ReactNode; horizontal?: boolean }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: props.horizontal ? "row" : "column",
			}}
		>
			{props.children}
		</div>
	)
}

function Item(props: { value: number; onMouseDown: MouseEventHandler }) {
	return <div onMouseDown={props.onMouseDown}>{props.value}</div>
}
```