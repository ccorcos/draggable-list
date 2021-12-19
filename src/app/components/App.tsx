import React, { MouseEventHandler, useCallback, useState } from "react"
import { useRefCurrent } from "../hooks/useRefCurrent"

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

function DraggableList<T>(props: {
	items: T[]
	onReorder(removeIndex: number, insertIndex: number): void
	Container(props: { children: React.ReactNode }): React.ReactElement
	Item(props: { value: T; onMouseDown: MouseEventHandler }): React.ReactElement
}) {
	const { items, onReorder, Container, Item } = props

	const onReorderRef = useRefCurrent(onReorder)

	const handleMouseDown = useCallback((event: React.MouseEvent) => {
		// Only respond to left-clicks
		if (event.button !== 0) {
			return
		}
		event.stopPropagation()
		event.preventDefault()

		const mouseStart = {
			x: event.pageX,
			y: event.pageY,
		}

		const target = event.target as HTMLElement
		const parent = target.parentNode as HTMLElement
		const nodes = Array.from(parent.children) as HTMLElement[]
		const startIndex = nodes.indexOf(target)

		// Measure the positions of all the items.
		const positions = nodes.map((node) => {
			const { top, left, height, width } = node.getBoundingClientRect()
			return { x: left, y: top, height, width }
		})

		const startPosition = positions[startIndex]
		let currentIndex = startIndex

		for (const node of nodes) {
			node.style.transition = "transform ease-in-out 50ms"
		}

		const handleMouseMove = (event: MouseEvent) => {
			const mouseCurrent = {
				x: event.pageX,
				y: event.pageY,
			}

			const mouseDelta = {
				x: mouseCurrent.x - mouseStart.x,
				y: mouseCurrent.y - mouseStart.y,
			}

			const currentPosition = {
				x: startPosition.x + mouseDelta.x,
				y: startPosition.y + mouseDelta.y,
			}

			const distances = positions.map((position) =>
				distance(currentPosition, position)
			)
			currentIndex = distances.indexOf(Math.min(...distances))

			// Given the list:
			// 1
			// 2
			// 3
			// 4
			// 5
			// If 3 is closer to 1, then 1 and 2 move down.
			// If 3 is closer to 5, then 4 and 5 move up.

			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i]

				// If this is the node we're currently dragging...
				if (i === startIndex) {
					node.style.transform = `translate(${mouseDelta.x}px, ${mouseDelta.y}px)`
					continue
				}

				// Get the range of nodes that we need to shift.
				const start = Math.min(startIndex, currentIndex)
				const end = Math.max(startIndex, currentIndex)

				if (i >= start && i <= end) {
					const direction = currentIndex < startIndex ? 1 : -1
					node.style.transform = `translate(0, ${
						direction * startPosition.height
					}px)`
					continue
				}

				// Clear the transform for the other nodes.
				node.style.transform = ""
			}
		}

		const handleMouseUp = () => {
			// Clear all transforms.
			// for (let i = 0; i < nodes.length; i++) {
			// 	const node = nodes[i]
			// 	node.style.transform = ""
			// }

			// Set all to their final positions.
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i]

				// If this is the node we're currently dragging...
				if (i === startIndex) {
					if (startIndex === currentIndex) {
						node.style.transform = ""
						continue
					}

					const desiredPosition = positions[currentIndex]
					const { x, y } = {
						x: desiredPosition.x - startPosition.x,
						y: desiredPosition.y - startPosition.y,
					}
					node.style.transform = `translate(${x}px, ${y}px)`
					continue
				}

				// Get the range of nodes that we need to shift.
				const start = Math.min(startIndex, currentIndex)
				const end = Math.max(startIndex, currentIndex)

				if (i >= start && i <= end) {
					const direction = currentIndex < startIndex ? 1 : -1
					node.style.transform = `translate(0, ${
						direction * startPosition.height
					}px)`
					continue
				}

				// Clear the transform for the other nodes.
				node.style.transform = ""
			}

			const handleTransitionEnd = () => {
				for (const node of nodes) {
					node.style.transition = ""
					node.style.transform = ""
				}
				onReorderRef.current(startIndex, currentIndex)
				target.removeEventListener("transitionend", handleTransitionEnd)
			}
			target.addEventListener("transitionend", handleTransitionEnd)

			window.removeEventListener("mousemove", handleMouseMove)
			window.removeEventListener("mouseup", handleMouseUp)
		}

		window.addEventListener("mousemove", handleMouseMove)
		window.addEventListener("mouseup", handleMouseUp)
	}, [])

	return (
		<Container>
			{items.map((value, index) => (
				<Item key={index} value={value} onMouseDown={handleMouseDown} />
			))}
		</Container>
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

type Point = { x: number; y: number }

function distance(a: Point, b: Point) {
	return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
	const newList = [...list]
	const [item] = newList.splice(startIndex, 1)
	newList.splice(endIndex, 0, item)
	return newList
}

// console.log(reorder([0, 1, 2, 3, 4], 2, 0))
// console.log(reorder([0, 1, 2, 3, 4], 2, 4))
