import { gql } from '@apollo/client'

export const TASK_FIELDS_FRAGMENT = gql`
  fragment TaskFields on Task {
    id
    title
    description
    completed
    dueDate
    tags
    order
    weatherCity
    weatherTemperature
    weatherCondition
    weatherIconUrl
    weatherFetchedAt
    createdAt
    updatedAt
  }
`

export const TASKS_QUERY = gql`
  query Tasks($filters: TaskFiltersInput) {
    tasks(filters: $filters) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS_FRAGMENT}
`

export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS_FRAGMENT}
`

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS_FRAGMENT}
`

export const DELETE_TASK_MUTATION = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      ...TaskFields
    }
  }
  ${TASK_FIELDS_FRAGMENT}
`
