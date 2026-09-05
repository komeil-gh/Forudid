import { Component, type ReactNode } from 'react'
import { fa } from '../messages/fa'
export class Boundary extends Component<{ children: ReactNode, fallback?: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { console.error(error) }
  render() {
    return this.state.failed ? <div role="alert" className="status">{this.props.fallback ?? fa.unexpected}</div> : this.props.children
  }
}
