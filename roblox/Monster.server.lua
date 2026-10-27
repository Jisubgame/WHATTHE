-- Monster (Script) — ServerScriptService/Monster
-- Step 1: patrols the ward, chases whoever it sees, catches on contact. Never enters the lobby or the vents.
local Players = game:GetService("Players")
local PathfindingService = game:GetService("PathfindingService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("Config"))

repeat task.wait() until workspace:FindFirstChild("Ward") and workspace.Ward:GetAttribute("Built")

-- a tall, pale placeholder body (the real model comes in step 2)
local desc = Instance.new("HumanoidDescription")
desc.HeightScale = 1.3
desc.WidthScale = 0.85
desc.DepthScale = 0.85
desc.HeadScale = 1.05
local pale = Color3.fromRGB(225, 220, 210)
desc.HeadColor, desc.TorsoColor = pale, pale
desc.LeftArmColor, desc.RightArmColor, desc.LeftLegColor, desc.RightLegColor = pale, pale, pale, pale
local monster = Players:CreateHumanoidModelFromDescription(desc, Enum.HumanoidRigType.R15)
monster.Name = "Monster"
local hum = monster:WaitForChild("Humanoid")
local root = monster:WaitForChild("HumanoidRootPart")
hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
hum.BreakJointsOnDeath = false
hum:SetStateEnabled(Enum.HumanoidStateType.Jumping, false)
local spawnPos = Config.cellToWorld(Config.MONSTER_SPAWN[1], Config.MONSTER_SPAWN[2])
monster:PivotTo(CFrame.new(spawnPos + Vector3.new(0, 5, 0)))
monster.Parent = workspace
root:SetNetworkOwner(nil)

-- --- helpers ---
local function scale()
	local n = math.max(1, #Players:GetPlayers())
	return n - 1
end

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude

local function alive(plr)
	local ch = plr.Character
	local h = ch and ch:FindFirstChildOfClass("Humanoid")
	local r = ch and ch:FindFirstChild("HumanoidRootPart")
	if h and r and h.Health > 0 then return ch, h, r end
end

-- can it see this player right now? (range, a wide cone in front, nothing in between)
local function canSee(plr)
	local ch, _, r = alive(plr)
	if not ch or Config.isSafe(r.Position) then return false end
	local head = monster:FindFirstChild("Head")
	if not head then return false end
	local range = Config.SIGHT_RANGE * (1 + Config.PER_PLAYER_SIGHT * scale())
	local to = r.Position - head.Position
	if to.Magnitude > range then return false end
	local look = root.CFrame.LookVector
	if look:Dot(to.Unit) < 0.25 and to.Magnitude > 10 then return false end   -- ~150° cone, but it senses you right behind it
	rayParams.FilterDescendantsInstances = { monster, ch }
	return workspace:Raycast(head.Position, to, rayParams) == nil
end

local function nearestVisible()
	local best, bestD
	for _, plr in ipairs(Players:GetPlayers()) do
		if canSee(plr) then
			local _, _, r = alive(plr)
			local d = (r.Position - root.Position).Magnitude
			if not bestD or d < bestD then best, bestD = plr, d end
		end
	end
	return best
end

local function nearestPlayerPos()
	local best, bestD
	for _, plr in ipairs(Players:GetPlayers()) do
		local _, _, r = alive(plr)
		if r and not Config.isSafe(r.Position) then
			local d = (r.Position - root.Position).Magnitude
			if not bestD or d < bestD then best, bestD = r.Position, d end
		end
	end
	return best
end

-- --- catching ---
local function tryCatch()
	for _, plr in ipairs(Players:GetPlayers()) do
		local ch, h, r = alive(plr)
		if ch and not Config.isSafe(r.Position) and (r.Position - root.Position).Magnitude < 4.5 then
			h.Health = 0   -- lives come in a later step
			return true
		end
	end
	return false
end

-- --- movement ---
local path = PathfindingService:CreatePath({
	AgentRadius = 2.5,
	AgentHeight = 7,
	AgentCanJump = false,
	Costs = { Safe = math.huge, Vent = math.huge },
})

local state = "PATROL"
local target, lastKnown, lostT = nil, nil, 0

-- walk a computed path; stops early when it spots someone
local function walkTo(goal)
	local ok = pcall(function() path:ComputeAsync(root.Position, goal) end)
	if not ok or path.Status ~= Enum.PathStatus.Success then return false end
	for i, wp in ipairs(path:GetWaypoints()) do
		if i > 1 then
			hum:MoveTo(wp.Position)
			local t0 = os.clock()
			while ((root.Position - wp.Position) * Vector3.new(1, 0, 1)).Magnitude > 2 and os.clock() - t0 < 2 do
				if tryCatch() then return true end
				local seen = nearestVisible()
				if seen then target = seen; state = "CHASE"; return true end
				task.wait(0.1)
			end
		end
	end
	return true
end

local function pickPatrolGoal()
	local nodes = Config.PATROL_NODES
	local near = nearestPlayerPos()
	local node
	if near and math.random() < 0.5 then   -- half the time it sweeps the part of the ward you're in
		local pr, pc = Config.worldToCell(near)
		local mr, mc = Config.worldToCell(root.Position)
		local sorted = {}
		for _, n in ipairs(nodes) do
			if math.abs(n[1] - mr) + math.abs(n[2] - mc) > 3 then table.insert(sorted, n) end
		end
		table.sort(sorted, function(a, b)
			return math.abs(a[1] - pr) + math.abs(a[2] - pc) < math.abs(b[1] - pr) + math.abs(b[2] - pc)
		end)
		node = sorted[math.random(1, math.min(4, #sorted))]
	end
	node = node or nodes[math.random(1, #nodes)]
	return Config.cellToWorld(node[1], node[2])
end

-- --- the loop ---
while true do
	local extra = scale()
	if state == "PATROL" then
		hum.WalkSpeed = Config.MONSTER_PATROL * (1 + Config.PER_PLAYER_SPEED * extra)
		walkTo(pickPatrolGoal())
	elseif state == "CHASE" then
		hum.WalkSpeed = Config.MONSTER_CHASE * (1 + Config.PER_PLAYER_SPEED * 0.5 * extra)
		local ch, r
		if target then ch, _, r = alive(target) end
		if ch and canSee(target) then
			lastKnown = r.Position
			lostT = 0
			hum:MoveTo(r.Position)   -- straight at you while it can see you
			task.wait(0.1)
		else
			local other = nearestVisible()
			if other then
				target = other
			else
				lostT += 0.1
				if lastKnown then
					hum:MoveTo(lastKnown)
					if (root.Position - lastKnown).Magnitude < 3 then lastKnown = nil end
				end
				task.wait(0.1)
				if lostT > Config.LOSE_SIGHT_TIME or not lastKnown then state = "SEARCH" end
			end
		end
		if tryCatch() then state = "SEARCH" end
	elseif state == "SEARCH" then
		hum:MoveTo(root.Position)
		for _ = 1, 30 do   -- stands and looks around for ~3 s
			root.CFrame = root.CFrame * CFrame.Angles(0, math.rad(4), 0)
			local seen = nearestVisible()
			if seen then target = seen; state = "CHASE"; break end
			task.wait(0.1)
		end
		if state == "SEARCH" then state = "PATROL" end
	end
end
