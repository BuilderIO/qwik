#![feature(test)]

extern crate test;

use qwik_core::*;
use test::Bencher;

#[bench]
fn transform_todo_app(b: &mut Bencher) {
	b.iter(|| {
      let code = r#"
      import {
          Fragment,
          Host,
          qComponent$,
          $,
          useStore,
          useHostElement,
          useEvent,
        } from '@builder.io/qwik';
        import {
          addItem,
          clearCompleted,
          FilterStates,
          getFilteredCount,
          getFilteredItems,
          removeItem,
          TodoItem,
          Todos,
          toggleItem,
          updateFilter,
        } from './state';


        export const ToDoApp = qComponent$((props: { todos: Todos }) => {
          return $(() => {
            console.log('on-qRender$ => <ToDoApp/>');
            return (
              <section class="todoapp">
                <Header todos={props.todos} />
                <Main todos={props.todos} />
                <Footer todos={props.todos} />
              </section>
            );
          });
        });

        export const Header = qComponent$((props: { todos: Todos }) => {
          const state = useStore({ text: '' });
          return $(() => {
            console.log('on-qRender$ => <Header/>');
            return (
              <>
                <h1>todos</h1>
                <input
                  class="new-todo"
                  placeholder="What needs to be done?"
                  autoFocus
                  value={state.text}
                  onKeyup$={() => {
                    const event = useEvent<KeyboardEvent>();
                    const inputValue = (event.target as HTMLInputElement).value;
                    state.text = inputValue;
                    if (event.key === 'Enter' && inputValue) {
                      addItem(props.todos, state.text);
                      state.text = '';
                    }
                  }}
                />
              </>
            );
          });
        });

        export const Main = qComponent$((props: { todos: Todos }) => {
          return $(() => {
            console.log('on-qRender$ => <Main/>');
            return (
              <div class="main">
                <ul class="todo-list">
                  {getFilteredItems(props.todos).map((key) => (
                    <Item item={key} todos={props.todos} />
                  ))}
                </ul>
              </div>
            );
          });
        });

        export const Item = qComponent$((props: { item: TodoItem; todos: Todos }) => {
          const state = useStore({ editing: false });
          return $(() => {
            console.log(
              'on-qRender$ => <Item item="' +
                JSON.stringify(props.item, (key, value) => (key.startsWith('__') ? undefined : value)) +
                '"/>'
            );
            return (
              <div class={{ completed: props.item.completed, editing: state.editing }}>
                <div class="view">
                  <input
                    class="toggle"
                    type="checkbox"
                    checked={props.item.completed}
                    onClick$={() => toggleItem(props.todos, props.item)}
                  />
                  <label
                    onDblclick$={async () => {
                      state.editing = true;
                      const hostElement = useHostElement()!;
                      await qNotifyRender(hostElement);
                      const inputEl = hostElement.querySelector('input.edit') as HTMLInputElement;
                      inputEl.focus();
                      inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
                    }}
                  >
                    {props.item.title}
                  </label>
                  <button class="destroy" onClick$={() => removeItem(props.todos, props.item)}></button>
                </div>
                {state.editing ? (
                  <input
                    class="edit"
                    value={props.item.title}
                    onBlur$={() => (state.editing = false)}
                    onKeyup$={() => {
                      const event = useEvent<KeyboardEvent>();
                      const inputValue = (event.target as HTMLInputElement).value;
                      props.item.title = inputValue;
                      if (event.key === 'Enter') {
                        state.editing = false;
                      }
                    }}
                  />
                ) : null}
              </div>
            );
          });
        });

        export const Footer = qComponent$((props: { todos: Todos }) => {
          return $(() => {
            console.log('on-qRender$ => <Footer/>');
            /**
             * Example of lite-component (it will always be included with the parent component)
             */
            function Filter({ filter }: { filter: FilterStates }) {
              const lMode = filter.toLowerCase();
              return (
                <li>
                  <a
                    class={{ selected: props.todos.filter == lMode }}
                    onClick$={() => updateFilter(props.todos, filter)}
                  >
                    {filter[0].toUpperCase() + filter.slice(1)}
                  </a>
                </li>
              );
            }
            const remaining = getFilteredCount(props.todos);
            return (
              <div class="footer">
                {props.todos.items.length > 0 ? (
                  <>
                    <span class="todo-count">
                      <strong>{remaining}</strong>
                      {remaining == 1 ? ' item' : ' items'} left
                    </span>
                    <ul class="filters">
                      {FilterStates.map((f) => (
                        <Filter filter={f} />
                      ))}
                    </ul>
                    {remaining > 0 ? (
                      <button class="clear-completed" onClick$={() => clearCompleted(props.todos)}>
                        Clear completed
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          });
        });
      "#;
      transform_modules(TransformModulesOptions {
        src_dir: "/user/qwik/src/".into(),
          input: vec![TransformModuleInput {
              code: code.into(),
              path: "file.tsx".into(),
          }],
          root_dir: None,
          core_module: None,
          source_maps: false,
          explicit_extensions: false,
          minify: MinifyMode::Simplify,
          transpile_ts: true,
          transpile_jsx: true,
          preserve_filenames: false,
          manual_chunks: None,
          entry_strategy: EntryStrategy::Single,
          mode: EmitMode::Prod,
          scope: None,
          reg_ctx_name: None,
          strip_exports: None,
          strip_ctx_name: None,
          strip_event_handlers: false,
          is_server: None,
      })
  });
}
