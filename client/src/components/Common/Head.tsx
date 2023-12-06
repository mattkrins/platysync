import { Box, Group, Title } from '@mantine/core'
import React from 'react'

interface Props {
    children: React.ReactNode;
    leftSection?: React.ReactNode;
    rightSection?: React.ReactNode;
}
export default function Head( { children, leftSection, rightSection, ...props }: Props ) {
  return (
    <Group justify="space-between" mb="xs" >
        <Box>
            <Title order={2} {...props}>{children}</Title>
            {leftSection}
        </Box>
        <Box/>
        <Box>{rightSection}</Box>
    </Group>
  )
}
